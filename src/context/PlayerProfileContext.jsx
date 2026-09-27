import { useCallback, useEffect, useMemo, useState } from 'react';
import { emptyPlayerProfile, loadPlayerProfile, playerProfileKey, savePlayerProfile } from '../domain/playerProfile.js';
import { PlayerProfileContext } from './playerProfileContext.js';

function browserStorage() {
  try { return window.localStorage; }
  catch { return null; }
}

function initialState(userId) {
  const storage = browserStorage();
  if (!storage) return { profile: emptyPlayerProfile(), error: 'El almacenamiento local no está disponible.' };
  try { return { profile: loadPlayerProfile(storage, userId), error: '' }; }
  catch { return { profile: emptyPlayerProfile(), error: 'No se pudo leer el perfil local. El contenido guardado no se modificó.' }; }
}

export function PlayerProfileProvider({ userId, children }) {
  const [state, setState] = useState(() => initialState(userId));

  // Browser tabs share the same local profile for the same signed-in account.
  useEffect(() => {
    const onStorage = event => {
      if (event.key === playerProfileKey(userId)) setState(initialState(userId));
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [userId]);

  const save = useCallback(profile => {
    const storage = browserStorage();
    if (!storage) throw new Error('El almacenamiento local no está disponible.');
    const saved = savePlayerProfile(storage, userId, profile);
    setState({ profile: saved, error: '' });
    return saved;
  }, [userId]);

  const value = useMemo(() => ({ profile: state.profile, loadError: state.error, save }), [state, save]);
  return <PlayerProfileContext.Provider value={value}>{children}</PlayerProfileContext.Provider>;
}
