import { CatalogValidationError, SENSITIVITY_FIELDS, fingerCount, knownValue, parseButtonRange, validateRecord } from './configContracts.js';

export function slug(value) {
  return String(value).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
}

export const deviceKey = record => `${slug(record.brand)}|${slug(record.model)}`;
export const distinctDeviceCount = records => new Set(records.map(deviceKey)).size;
export function legacyId(kind, record) {
  // Reproduce each original importer's identity, including treino's accent handling.
  return kind === 'treinos'
    ? record.title.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '')
    : [record.brand, record.model, record.profile].map(slug).join('_');
}

// Explicit unresolved findings of CORE_CONFIG_AUDIT, not inferred hardware.
export function pendingConflicts(record) {
  if (slug(record.brand) !== 'samsung') return [];
  if (['a05', 'a23'].includes(slug(record.model))) return ['button_ranges'];
  if (slug(record.model) === 'a32') return ['aim_direction'];
  return [];
}

export function readLegacyCatalog(kind, records, options = {}) {
  const file = options.file ?? `${kind}.json`;
  if (!Array.isArray(records)) throw new CatalogValidationError([{ file, record: 1, field: '$', message: 'se esperaba una lista' }]);
  const issues = records.flatMap((record, index) => validateRecord(kind, record, index, { ...options, file }));
  const seen = new Map();
  records.forEach((record, index) => {
    if (validateRecord(kind, record, index, { ...options, file }).length) return;
    const id = legacyId(kind, record);
    if (seen.has(id)) issues.push({ file, record: index + 1, field: 'id', message: `colisión de slug ${id} con registro ${seen.get(id)}` });
    else seen.set(id, index + 1);
  });
  if (issues.length) throw new CatalogValidationError(issues);
  return records.map(record => ({
    ...record,
    id: record.id ?? legacyId(kind, record),
    legacy: { ...record },
    integrity: {
      source: 'legacy_unknown', state: 'not_validated', file, legacyId: record.id ?? legacyId(kind, record),
      compatibility: 'unknown', hz: knownValue(undefined),
      dpi: knownValue(record.dpi, { notApplicable: record.brand === 'Apple' && record.dpi === 0 }),
      fingers: knownValue(fingerCount(record.fingers)),
      availability: { graphics: 'unconfirmed', highFps: 'unconfirmed', shadow: 'unconfirmed', filters: 'unconfirmed' },
      conflicts: pendingConflicts(record),
    },
  }));
}

export function compareCatalogs(huds, configs) {
  const numeric = [];
  const textual = [];
  for (const h of huds) {
    const c = configs.find(c => deviceKey(c) === deviceKey(h) && c.profile === h.profile);
    if (!c) continue;
    for (const [field, pattern] of [
      ['fireButton', /(?:Botão de tiro|Tiro):\s*(\d+\s*[–-]\s*\d+%)/i],
      ['aimButton', /(?:Botão de mira|Mira):\s*(\d+\s*[–-]\s*\d+%)/i],
    ]) {
      const hud = parseButtonRange(h.steps.match(pattern)?.[1]);
      const config = parseButtonRange(c[field]);
      if (hud && config && JSON.stringify(hud) !== JSON.stringify(config)) numeric.push({ device: deviceKey(h), field, hud, config });
    }
    if (/reduza mira/i.test(h.notes) && /aumente mira/i.test(c.tips)) textual.push({ device: deviceKey(h), field: 'aim_direction', hud: h.notes, config: c.tips });
  }
  return { numeric, textual };
}

export function auditCatalogs(input) {
  const catalogs = Object.fromEntries(['presets', 'huds', 'configs', 'treinos'].map(kind => [kind, readLegacyCatalog(kind, input[kind])]));
  const { presets, huds, configs, treinos } = catalogs;
  const keys = list => new Set(list.map(deviceKey));
  const hkeys = keys(huds), ckeys = keys(configs);
  const conflicts = compareCatalogs(huds, configs);
  return {
    counts: { presets: presets.length, huds: huds.length, configs: configs.length, treinos: treinos.length },
    sharedDevices: [...keys(presets)].filter(k => hkeys.has(k) && ckeys.has(k)).length,
    brands: new Set([...presets, ...huds, ...configs].map(p => p.brand)).size,
    profiles: [...new Set([...presets, ...huds, ...configs].map(p => p.profile))],
    sensitivityVectors: new Set(presets.map(p => JSON.stringify(SENSITIVITY_FIELDS.map(f => p[f.key])))).size,
    conflicts, hudsWithoutImage: huds.filter(h => !h.imageUrl).length,
    hudFingers: [...new Set(huds.map(h => fingerCount(h.fingers)))],
    freeLook: { min: Math.min(...presets.map(p => p.freeLook)), max: Math.max(...presets.map(p => p.freeLook)) },
  };
}
