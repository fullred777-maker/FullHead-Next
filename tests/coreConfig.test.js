import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { readLegacyCatalog, auditCatalogs, compareCatalogs, distinctDeviceCount } from '../src/domain/legacyCatalog.js';
import { CatalogValidationError, SENSITIVITY_FIELDS, knownValue, fingerCount, availabilityLabel, sensitivitySnapshot, changeSensitivity, saveSensitivitySnapshot } from '../src/domain/configContracts.js';
import { assertLegacyBaseline, auditLocalFiles } from '../scripts/auditCoreConfig.js';
import { copyText } from '../src/utils/copyText.js';

const raw = Object.fromEntries(await Promise.all(['presets', 'huds', 'configs', 'treinos'].map(async kind => [kind, JSON.parse(await readFile(new URL(`../${kind}.json`, import.meta.url), 'utf8'))])));

function invalid(kind, mutate, field) {
  const record = structuredClone(raw[kind][0]);
  mutate(record);
  assert.throws(() => readLegacyCatalog(kind, [record]), error => {
    assert.ok(error instanceof CatalogValidationError);
    assert.ok(error.issues.some(i => i.file === `${kind}.json` && i.record === 1 && i.field === field));
    assert.match(error.message, /registro 1/);
    return true;
  });
}

for (const kind of Object.keys(raw)) {
  test(`${kind}: required fields, unexpected fields and boolean are strict`, () => {
    invalid(kind, r => delete r.isPremium, 'isPremium');
    invalid(kind, r => r.isPremium = 'false', 'isPremium');
    invalid(kind, r => r.unexpected = 1, 'unexpected');
    invalid(kind, r => r.notes = [], 'notes');
  });
  test(`${kind}: preserves every legacy field and attaches unvalidated provenance`, () => {
    const result = readLegacyCatalog(kind, raw[kind]);
    result.forEach((entry, index) => {
      assert.deepEqual(entry.legacy, raw[kind][index]);
      for (const field of Object.keys(raw[kind][index])) assert.deepEqual(entry[field], raw[kind][index][field]);
      assert.equal(entry.integrity.source, 'legacy_unknown');
      assert.equal(entry.integrity.state, 'not_validated');
      assert.equal(entry.integrity.file, `${kind}.json`);
      assert.ok(entry.integrity.legacyId);
      assert.equal(entry.integrity.hz.status, 'unknown');
    });
  });
}

test('missing, wrong type, nonfinite and out-of-range numbers fail without coercion', () => {
  for (const value of [undefined, null, '95', NaN, Infinity, -1, 201, 95.5]) invalid('presets', r => r.general = value, 'general');
  invalid('huds', r => delete r.fingers, 'fingers');
  invalid('huds', r => r.fingers = 2, 'fingers');
  invalid('configs', r => r.fireButton = '150–200%', 'fireButton');
  invalid('presets', r => r.constructor = 'unexpected', 'constructor');
});

test('slug collisions identify the second record and field', () => {
  const a = { ...raw.presets[0], model: 'Á 05' }, b = { ...a, model: 'A-05' };
  assert.throws(() => readLegacyCatalog('presets', [a, b]), /presets.json · registro 2 · id: colisión/);
});

test('transport metadata is explicit; source ID and timestamp are retained', () => {
  const record = { ...raw.presets[0], id: 'original-id', updatedAt: new Date(0) };
  assert.throws(() => readLegacyCatalog('presets', [record]), /campo inesperado/);
  const entry = readLegacyCatalog('presets', [record], { transport: true })[0];
  assert.equal(entry.integrity.legacyId, 'original-id');
  assert.deepEqual(entry.legacy, record);
});

test('unknown, not applicable and real zero are distinct; fingers never default to two', () => {
  assert.equal(knownValue(undefined).status, 'unknown');
  assert.equal(knownValue(null).status, 'unknown');
  assert.deepEqual(knownValue(0), { status: 'known', value: 0, raw: 0 });
  const iphone = readLegacyCatalog('presets', raw.presets).find(r => r.brand === 'Apple');
  assert.equal(iphone.integrity.dpi.status, 'not_applicable');
  assert.equal(iphone.legacy.dpi, 0);
  assert.equal(fingerCount(undefined), null);
  assert.equal(fingerCount('4 dedos'), 4);
  assert.equal(readLegacyCatalog('presets', raw.presets)[0].integrity.fingers.status, 'unknown');
});

test('application capabilities remain unconfirmed, not unavailable or confirmed by catalog text', () => {
  const entry = readLegacyCatalog('configs', raw.configs)[0];
  assert.equal(entry.integrity.availability.highFps, 'unconfirmed');
  assert.equal(availabilityLabel('available'), 'Disponible: confirmado por ti');
  assert.equal(availabilityLabel('unavailable'), 'No disponible');
  assert.equal(availabilityLabel('unconfirmed'), 'Recomendación');
});

test('all six sensitivities survive load and mock save, including 67 and 76', async () => {
  for (const preset of raw.presets) {
    const loaded = sensitivitySnapshot(preset);
    let saved;
    await saveSensitivitySnapshot(loaded, async snapshot => { saved = structuredClone(snapshot); });
    assert.deepEqual(saved, Object.fromEntries(SENSITIVITY_FIELDS.map(f => [f.key, preset[f.key]])));
    assert.equal(saved.freeLook, preset.freeLook);
  }
});

test('read-only freeLook rejects edits; invalid saved data never reaches the writer', async () => {
  const loaded = sensitivitySnapshot(raw.presets[0]);
  assert.throws(() => changeSensitivity(loaded, 'freeLook', 40), /solo lectura/);
  assert.equal(changeSensitivity(loaded, 'general', 0).general, 0);
  assert.equal(loaded.general, 95);
  assert.throws(() => changeSensitivity(loaded, 'general', 201));
  let calls = 0;
  await assert.rejects(saveSensitivitySnapshot({ ...loaded, freeLook: undefined }, async () => calls++));
  assert.equal(calls, 0);
  await assert.rejects(saveSensitivitySnapshot(loaded, async () => { throw new Error('mock offline'); }), /mock offline/);
});

test('A05, A23 and A32 conflicts preserve both original instructions', () => {
  const result = compareCatalogs(raw.huds, raw.configs);
  assert.deepEqual(result.numeric.map(r => [r.device, r.field, r.hud, r.config]), [
    ['samsung|a05', 'fireButton', [48, 55], [50, 56]],
    ['samsung|a05', 'aimButton', [38, 45], [40, 46]],
    ['samsung|a23', 'fireButton', [50, 55], [49, 55]],
    ['samsung|a23', 'aimButton', [40, 46], [39, 45]],
  ]);
  assert.equal(result.textual[0].device, 'samsung|a32');
  for (const kind of ['presets', 'huds', 'configs']) {
    const entries = readLegacyCatalog(kind, raw[kind]);
    assert.deepEqual(entries.filter(r => r.integrity.conflicts.length).map(r => r.model), ['A05', 'A23', 'A32']);
  }
});

test('local audit verifies all approved baseline counts and fails changed invariants', async () => {
  const report = await auditLocalFiles();
  assertLegacyBaseline(report);
  assert.deepEqual(report.counts, { presets: 18, huds: 18, configs: 18, treinos: 4 });
  assert.equal(report.sharedDevices, 18);
  assert.equal(report.brands, 4);
  assert.deepEqual(report.profiles, ['Geral']);
  assert.equal(report.sensitivityVectors, 12);
  assert.equal(report.hudsWithoutImage, 18);
  assert.deepEqual(report.hudFingers, [2]);
  assert.deepEqual(report.freeLook, { min: 67, max: 76 });
  assert.throws(() => assertLegacyBaseline({ ...report, sensitivityVectors: 13 }), /vetores/);
  assert.throws(() => auditCatalogs({ ...raw, huds: 'bad' }), /huds.json.*registro 1.*\$/);
  assert.equal(distinctDeviceCount([...raw.presets, { ...raw.presets[0], profile: 'extra' }]), 18);
});

test('legacy files remain byte-for-byte unchanged', async () => {
  const hashes = { presets: 'c41bccccf0e80b89bd79fd5b682d85a0290ed5e135b3c7dd2e3212e00df622b2', huds: '66aa950c8b00a2db10370d0a647e3bdf6a19728f4ecb7b958e17449be74eb89e', configs: '3872f37aeb7c559bb2a52fda5add2fe62bc0f1790d812d92860ab9d93c38050c', treinos: 'acdc2ae8bc8db4e0acad823b9408144c09668312e10ad9385ce095fdca139c8e' };
  for (const [kind, hash] of Object.entries(hashes)) assert.equal(createHash('sha256').update(await readFile(new URL(`../${kind}.json`, import.meta.url))).digest('hex'), hash);
});

test('clipboard success waits for confirmation; rejection and missing API offer manual text', async () => {
  let resolveWrite, settled = false;
  const pending = copyText('exact\ntext', { writeText: () => new Promise(resolve => { resolveWrite = resolve; }) }).then(result => { settled = true; return result; });
  await Promise.resolve();
  assert.equal(settled, false);
  resolveWrite();
  assert.deepEqual(await pending, { copied: true, text: 'exact\ntext' });
  for (const api of [null, { writeText: async () => { throw new Error('denied'); } }]) {
    const result = await copyText('manual original', api);
    assert.equal(result.copied, false);
    assert.equal(result.text, 'manual original');
    assert.match(result.message, /manualmente/);
  }
});
