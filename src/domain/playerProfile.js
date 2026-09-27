export const PLAYER_PROFILE_VERSION = 1;
export const PLAYER_PROFILE_FIELDS = Object.freeze(['brand', 'model', 'variant', 'fingers', 'objective', 'gameVersion']);

export function emptyPlayerProfile() {
  return { brand: null, model: null, variant: null, fingers: null, objective: null, gameVersion: null };
}

export function normalizePlayerProfile(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('El perfil debe ser un objeto.');
  const result = emptyPlayerProfile();
  for (const key of PLAYER_PROFILE_FIELDS) {
    const value = input[key];
    if (value === undefined || value === null || value === '') continue;
    if (key === 'fingers') {
      if (![2, 3, 4].includes(value)) throw new Error('La cantidad de dedos debe ser 2, 3 o 4.');
      result.fingers = value;
      continue;
    }
    if (typeof value !== 'string') throw new Error(`El campo ${key} debe ser texto.`);
    const normalized = value.trim().replace(/\s+/g, ' ');
    if (!normalized) continue;
    const limit = key === 'objective' ? 120 : key === 'gameVersion' ? 40 : 80;
    if (normalized.length > limit) throw new Error(`El campo ${key} supera ${limit} caracteres.`);
    result[key] = normalized;
  }
  const unexpected = Object.keys(input).find(key => !PLAYER_PROFILE_FIELDS.includes(key));
  if (unexpected) throw new Error(`Campo de perfil desconocido: ${unexpected}.`);
  return result;
}

export function playerProfileKey(userId) {
  if (typeof userId !== 'string' || !userId.trim()) throw new Error('Usuario no identificado.');
  return `fullhead-next.player-profile.v${PLAYER_PROFILE_VERSION}.${encodeURIComponent(userId)}`;
}

export function loadPlayerProfile(storage, userId) {
  const saved = storage.getItem(playerProfileKey(userId));
  if (saved === null) return emptyPlayerProfile();
  const document = JSON.parse(saved);
  if (!document || document.schemaVersion !== PLAYER_PROFILE_VERSION) throw new Error('Versión de perfil local desconocida; no se modificó.');
  return normalizePlayerProfile(document.profile);
}

export function savePlayerProfile(storage, userId, profile) {
  const normalized = normalizePlayerProfile(profile);
  storage.setItem(playerProfileKey(userId), JSON.stringify({ schemaVersion: PLAYER_PROFILE_VERSION, profile: normalized }));
  return normalized;
}
