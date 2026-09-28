// Local data contracts. These plausibility bounds are not device validation.
export const SENSITIVITY_FIELDS = Object.freeze([
  { key: 'general', label: 'General', min: 0, max: 200, step: 1, editable: true, color: '#D4A017' },
  { key: 'redDot', label: 'Red Dot', min: 0, max: 200, step: 1, editable: true, color: '#C0392B' },
  { key: 'x2', label: 'Mira 2x', min: 0, max: 200, step: 1, editable: true, color: '#1A6FA8' },
  { key: 'x4', label: 'Mira 4x', min: 0, max: 200, step: 1, editable: true, color: '#1E8C4A' },
  { key: 'awm', label: 'AWM', min: 0, max: 200, step: 1, editable: true, color: '#8E44AD' },
  { key: 'freeLook', label: 'Mirada Libre', min: 0, max: 200, step: 1, editable: false, color: '#E67E22' },
].map(Object.freeze));

const common = { brand: 'text', model: 'text', profile: 'text', notes: 'string', isPremium: 'boolean' };
export const LEGACY_SCHEMAS = Object.freeze({
  presets: { ...common, ...Object.fromEntries(SENSITIVITY_FIELDS.map(f => [f.key, 'sensitivity'])), dpi: 'number' },
  huds: { ...common, fingers: 'fingers', description: 'text', steps: 'text', imageUrl: 'string' },
  configs: { ...common, dpi: 'number', fireButton: 'range', aimButton: 'range', graphics: 'text', highFps: 'text', shadow: 'text', filters: 'text', tips: 'string' },
  treinos: { title: 'text', category: 'text', duration: 'text', level: 'text', description: 'text', steps: 'text', frequency: 'text', videoUrl: 'string', notes: 'string', isPremium: 'boolean' },
});

export class CatalogValidationError extends Error {
  constructor(issues) {
    super(issues.map(i => `${i.file} · registro ${i.record} · ${i.field}: ${i.message}`).join('\n'));
    this.name = 'CatalogValidationError';
    this.issues = issues;
  }
}

export function parseButtonRange(value) {
  if (typeof value !== 'string') return null;
  const match = /^(\d+)\s*[–-]\s*(\d+)%$/.exec(value.trim());
  if (!match) return null;
  const [, low, high] = match.map(Number);
  return low >= 0 && high <= 100 && low <= high ? [low, high] : null;
}

export function fingerCount(value) {
  const match = typeof value === 'string' && /^(\d+) dedos$/.exec(value);
  return match ? Number(match[1]) : null;
}

export function knownValue(value, { notApplicable = false } = {}) {
  if (notApplicable) return { status: 'not_applicable', value: null, raw: value };
  if (value === undefined || value === null || value === '') return { status: 'unknown', value: null, raw: value };
  return { status: 'known', value, raw: value };
}

export function availabilityLabel(status = 'unconfirmed') {
  return ({ available: 'Disponible: confirmado por ti', unavailable: 'No disponible', unconfirmed: 'Recomendación' })[status] ?? 'Recomendación';
}

export function validateRecord(kind, record, index = 0, { file = `${kind}.json`, transport = false } = {}) {
  const schema = LEGACY_SCHEMAS[kind];
  if (!schema) throw new Error(`Catálogo desconocido: ${kind}`);
  const issues = [];
  const report = (field, message) => issues.push({ file, record: index + 1, field, message });
  if (!record || typeof record !== 'object' || Array.isArray(record)) {
    report('$', 'se esperaba un objeto');
    return issues;
  }
  for (const field of Object.keys(record)) {
    if (!Object.hasOwn(schema, field) && !(transport && ['id', 'updatedAt'].includes(field))) report(field, 'campo inesperado');
  }
  if (transport && 'id' in record && (typeof record.id !== 'string' || !record.id.trim())) report('id', 'ID inválido');
  for (const [field, type] of Object.entries(schema)) {
    const value = record[field];
    if (value === undefined || value === null) { report(field, 'campo obligatorio ausente'); continue; }
    const numeric = type === 'number' || type === 'sensitivity';
    if (numeric) {
      if (typeof value !== 'number' || !Number.isFinite(value) || !Number.isInteger(value) || value < 0) report(field, 'se esperaba un entero finito no negativo');
      else if (type === 'sensitivity' && value > SENSITIVITY_FIELDS.find(f => f.key === field).max) report(field, 'fuera del intervalo de lectura 0–200; no se ajustará automáticamente');
    } else if (type === 'boolean') {
      if (typeof value !== 'boolean') report(field, 'se esperaba booleano, sin conversión');
    } else if (typeof value !== 'string') report(field, 'se esperaba texto');
    else if (type !== 'string' && !value.trim()) report(field, 'texto obligatorio vacío');
    else if (type === 'fingers' && ![2, 3, 4].includes(fingerCount(value))) report(field, 'cantidad de dedos no reconocida');
    else if (type === 'range' && !parseButtonRange(value)) report(field, 'intervalo porcentual inválido');
  }
  return issues;
}

export function sensitivitySnapshot(record) {
  const snapshot = {};
  const issues = [];
  for (const field of SENSITIVITY_FIELDS) {
    const value = record?.[field.key];
    if (typeof value !== 'number' || !Number.isFinite(value) || !Number.isInteger(value) || value < field.min || value > field.max) {
      issues.push({ file: 'ajuste personal', record: 1, field: field.key, message: 'valor ausente o inválido; se conserva el ajuste anterior' });
    } else snapshot[field.key] = value;
  }
  if (issues.length) throw new CatalogValidationError(issues);
  return snapshot;
}

export function changeSensitivity(values, key, value) {
  const field = SENSITIVITY_FIELDS.find(f => f.key === key);
  if (!field?.editable) throw new Error('Este control es de solo lectura hasta confirmar su contrato de edición.');
  return sensitivitySnapshot({ ...values, [key]: value });
}

// Used by both the real save boundary and tests with an injected mock writer.
export async function saveSensitivitySnapshot(values, write) {
  const snapshot = sensitivitySnapshot(values);
  await write(snapshot);
  return snapshot;
}
