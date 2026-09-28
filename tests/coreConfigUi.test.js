import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { Buffer } from 'node:buffer';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { readLegacyCatalog } from '../src/domain/legacyCatalog.js';
import { SENSITIVITY_FIELDS } from '../src/domain/configContracts.js';

const require = createRequire(import.meta.url);
// Compile in memory. Every Firebase entry is replaced; effects never run in SSR.
const bundle = await build({
  stdin: { contents: 'export { LiveSlider } from "./src/pages/CalibradorLive.jsx"; export { PresetCard } from "./src/pages/Sensi.jsx"; export { HudCard, FingersBadge } from "./src/pages/Hud.jsx"; export { ConfigCard } from "./src/pages/Configs.jsx"; export { CopyFallback } from "./src/components/CatalogNotice.jsx";', resolveDir: fileURLToPath(new URL('../', import.meta.url)) },
  bundle: true, write: false, format: 'esm', platform: 'node', jsx: 'automatic',
  plugins: [{ name: 'offline-only', setup(builder) {
    builder.onResolve({ filter: /^react(?:-dom|-router-dom)?(?:\/|$)/ }, args => ({ path: pathToFileURL(require.resolve(args.path)).href, external: true }));
    builder.onResolve({ filter: /(?:^firebase\/|\/firebase(?:\.js)?$)/ }, () => ({ path: 'firebase', namespace: 'mock' }));
    builder.onLoad({ filter: /.*/, namespace: 'mock' }, () => ({ contents: 'export const db = {}; export const auth = {}; export const collection = () => { throw Error("Remote access prohibited in M1 tests"); }; export const getDocs = collection, addDoc = collection, deleteDoc = collection, doc = collection, query = collection, where = collection, serverTimestamp = collection;' }));
  } }],
});
const ui = await import('data:text/javascript;base64,' + Buffer.from(bundle.outputFiles[0].text).toString('base64'));
const render = (component, props) => renderToStaticMarkup(React.createElement(component, props));
const records = async kind => readLegacyCatalog(kind, JSON.parse(await readFile(new URL(`../${kind}.json`, import.meta.url), 'utf8')));

test('real slider renders 67 and 76 unchanged, disabled, with a read-only explanation', () => {
  for (const value of [67, 76]) {
    const html = render(ui.LiveSlider, { field: SENSITIVITY_FIELDS.find(f => f.key === 'freeLook'), value, onChange() {} });
    assert.match(html, new RegExp('value="' + value + '"'));
    assert.match(html, /disabled=""/);
    assert.match(html, /Solo lectura/);
    assert.match(html, /max="200"/);
  }
});

test('future fingers are not labeled two; missing fingers are unknown', () => {
  assert.match(render(ui.FingersBadge, {}), /DEDOS DESCONOCIDOS/);
  assert.match(render(ui.FingersBadge, { fingers: '4 dedos' }), /4 DEDOS/);
});

test('actual cards show pending conflicts and suspend conflicting HUD/config copying', async () => {
  for (const [kind, component, prop] of [['huds', ui.HudCard, 'h'], ['configs', ui.ConfigCard, 'c']]) {
    for (const entry of (await records(kind)).filter(r => ['A05', 'A23', 'A32'].includes(r.model))) {
      const html = render(component, { [prop]: entry, onCopy() {} });
      assert.match(html, /Revisión recomendada/);
      assert.match(html, /disabled=""/);
      assert.match(html, /Frecuencia de pantalla: usa la opción indicada por tu dispositivo/);
      assert.doesNotMatch(html, /60Hz · BASE/);
    }
  }
});

test('sensitivity card preserves freeLook and presents neutral recommendation copy', async () => {
  const p = (await records('presets')).find(p => p.freeLook === 76);
  const html = render(ui.PresetCard, { p, onCopy() {}, idx: 0, isPopular: false });
  assert.match(html, />76<\/div>/);
  assert.match(html, /Recomendación FullHead/);
  assert.match(html, /DPI legado · no requerido/);
});

test('manual fallback includes exact text and accessible selection area', () => {
  const html = render(ui.CopyFallback, { text: 'line 1\nline 2', onClose() {} });
  assert.match(html, /role="alert"/);
  assert.match(html, /Texto para copiar manualmente/);
  assert.match(html, /line 1\nline 2/);
  assert.equal(render(ui.CopyFallback, { text: '', onClose() {} }), '');
});

test('Config Pro distinguishes capability states without certifying catalog values', async () => {
  const c = (await records('configs')).find(c => c.model === 'A12');
  const initial = render(ui.ConfigCard, { c, onCopy() {} });
  assert.match(initial, /value="unconfirmed" selected=""/);
  assert.match(initial, /Recomendación/);
  const unavailable = { ...c, integrity: { ...c.integrity, availability: { ...c.integrity.availability, highFps: 'unavailable' } } };
  assert.match(render(ui.ConfigCard, { c: unavailable, onCopy() {} }), /No disponible: conserva tu ajuste/);
  const available = { ...c, integrity: { ...c.integrity, availability: { ...c.integrity.availability, highFps: 'available' } } };
  assert.match(render(ui.ConfigCard, { c: available, onCopy() {} }), /value="available" selected=""/);
  assert.match(initial, /Consulta la guía de HUD/);
});
