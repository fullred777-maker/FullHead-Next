import { useContext } from 'react';
import { PlayerProfileContext } from '../context/playerProfileContext.js';

export function usePlayerProfile() {
  const context = useContext(PlayerProfileContext);
  if (!context) throw new Error('Perfil activo fuera del proveedor.');
  return context;
}
