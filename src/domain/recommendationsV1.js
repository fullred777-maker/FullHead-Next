export const V1_COLLECTION = 'recommendations_v1';
export const V1_VERSION = '1.0.0-offline';
export const SENS_KEYS = ['general', 'redDot', 'x2', 'x4', 'awm', 'freeLook'];
export const V1_COPY = Object.freeze({
  title: 'Recomendação inicial FullHead', subtitle: 'Ajuste inicial personalizável',
  calibration: 'Calibre um ajuste por vez conforme seu conforto e mantenha os valores anteriores para voltar quando quiser.',
  variant: 'Selecione a variante do aparelho',
});
export const emptySelection = () => ({ deviceId: '', variantId: '', platform: '', profile: '', objective: '', fingers: '', sensitivityId: '', hudId: '', configId: '' });
export function normalizeSelection(input) {
  const clean = emptySelection();
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw Error('Seleção V1 inválida.');
  for (const [key, value] of Object.entries(input)) {
    if (!(key in clean) || typeof value !== 'string' || value.length > 180) throw Error('Seleção V1 inválida.');
    clean[key] = value;
  }
  if (clean.platform && !['Android', 'iOS', 'Emulador'].includes(clean.platform)) throw Error('Plataforma inválida.');
  if (clean.fingers && !['2', '3', '4'].includes(clean.fingers)) throw Error('Dedos inválidos.');
  return clean;
}
// User changes invalidate dependent choices; no first-item defaults.
export function changeSelection(current, key, value) {
  const s = normalizeSelection({ ...current, [key]: value });
  const clear = keys => keys.forEach(k => { s[k] = ''; });
  if (key === 'deviceId') return { ...emptySelection(), deviceId: value, objective: current.objective || '' };
  if (key === 'variantId') clear(['platform', 'sensitivityId', 'hudId', 'configId']);
  if (key === 'platform') clear(['sensitivityId', 'hudId', 'configId']);
  if (key === 'profile') clear(['fingers', 'sensitivityId', 'hudId', 'configId']);
  if (key === 'fingers') clear(['sensitivityId', 'hudId', 'configId']);
  return s;
}
export function availableChoices(device, s) {
  const empty = { ready: false, sensitivities: [], huds: [], configs: [] };
  if (!device) return empty;
  const variant = device.variants.find(v => v.id === s.variantId);
  if (!variant || !s.platform || !s.profile || !s.fingers) return empty;
  if ((variant.platform || device.platform) && s.platform !== (variant.platform || device.platform)) return empty;
  const matches = option => option.profile === s.profile &&
    (!option.platform || option.platform === s.platform) &&
    (!option.variantId || option.variantId === variant.id);
  return {
    ready: true,
    sensitivities: device.options.filter(o => matches(o) && (o.fingers === null || String(o.fingers) === s.fingers)),
    huds: device.huds.filter(o => o.profile === s.profile && (o.fingers === null || String(o.fingers) === s.fingers)),
    configs: device.configs.filter(o => o.profile === s.profile),
  };
}
export function selectedChoices(device, s) {
  const lists = availableChoices(device, s);
  return { ...lists,
    sensitivity: lists.sensitivities.find(o => o.id === s.sensitivityId) || null,
    hud: lists.huds.find(o => o.id === s.hudId) || null,
    config: lists.configs.find(o => o.id === s.configId) || null,
  };
}
export function assertCatalog(devices) {
  if (!Array.isArray(devices) || devices.length !== 154) throw Error('Catálogo V1 deve conter 154 aparelhos.');
  const ids = new Set(), options = new Set();
  for (const d of devices) {
    if (!d.id || ids.has(d.id) || !d.brand || !d.model || d.activeOption !== null) throw Error('Identidade V1 inválida.');
    ids.add(d.id);
    if (d.schemaVersion !== 1 || !d.variants.length || !Array.isArray(d.huds) || !Array.isArray(d.configs)) throw Error('Estrutura V1 inválida.');
    if (new Set(d.variants.map(v => v.id)).size !== d.variants.length) throw Error('Variantes duplicadas.');
    for (const o of d.options) {
      if (!o.id || options.has(o.id) || !d.profiles.includes(o.profile)) throw Error('Opção V1 inválida.');
      options.add(o.id);
      if (o.active !== false || o.needsCalibration !== true || o.revisadaPeloFullHead !== false || o.testadaPorUsuarios !== false) throw Error('Estado V1 inválido.');
      if (o.scale.min !== 0 || o.scale.max !== 200 || SENS_KEYS.some(k => !Number.isInteger(o.values[k]) || o.values[k] < 0 || o.values[k] > 200)) throw Error('Escala V1 inválida.');
      if (o.variantId && !d.variants.some(v => v.id === o.variantId)) throw Error('Variante de opção ausente.');
      if (!o.origins.length || SENS_KEYS.some(k => !o.origins.some(r => Number.isInteger(r.values[k])))) throw Error('Procedência ausente.');
    }
  }
  if (options.size !== 189) throw Error('Catálogo V1 deve conter 189 opções.');
  return devices;
}
export function provenanceLabel(option) {
  if (option.rule === 'R1') return 'Valores originais do catálogo, preservados';
  if (option.rule === 'R2') return 'Referências de aparelhos comparáveis, com cálculo documentado';
  return 'Valores próprios do aparelho, preservados como ponto de partida';
}
