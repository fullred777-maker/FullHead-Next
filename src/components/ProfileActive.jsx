import { useState } from 'react';
import { usePlayerProfile } from '../hooks/usePlayerProfile.js';

const labels = {
  brand: 'Marca', model: 'Modelo', variant: 'Variante', fingers: 'Dedos',
  objective: 'Objetivo', gameVersion: 'Versión del juego',
};

function display(value) {
  return value === null ? 'Desconocido' : String(value);
}

export default function ProfileActive() {
  const { profile, loadError, save } = usePlayerProfile();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(profile);
  const [error, setError] = useState('');

  function beginEdit() {
    setDraft({ ...profile });
    setError('');
    setEditing(true);
  }

  function handleSubmit(event) {
    event.preventDefault();
    try {
      const next = { ...draft };
      if (['brand','model','variant','fingers','objective'].some(k => draft[k] !== profile[k])) delete next.selectionV1;
      save(next);
      setEditing(false);
      setError('');
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'No se pudo guardar el perfil.');
    }
  }

  const card = { border: '1px solid rgba(212,170,0,.32)', background: 'linear-gradient(135deg,#151409,#0C0E18 65%)', borderRadius: '12px', padding: '16px', marginBottom: '18px', color: '#E8DDB0', boxShadow: '0 8px 28px rgba(0,0,0,.2)' };
  const field = { minWidth: '125px', flex: '1 1 160px', fontSize: '11px', color: '#8B97BA' };
  const input = { display: 'block', width: '100%', marginTop: '5px', padding: '10px 11px', borderRadius: '7px', border: '1px solid #343149', background: '#080A10', color: '#E8DDB0', boxSizing: 'border-box', font: 'inherit' };
  const button = { border: '1px solid #A68631', background: 'rgba(212,170,0,.12)', color: '#E6C868', borderRadius: '7px', padding: '8px 12px', cursor: 'pointer', fontWeight: 700 };

  return (
    <section aria-label="Perfil activo" style={card}>
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: '12px', letterSpacing: '1.6px', textTransform: 'uppercase', color: '#E6C868', fontWeight: 800 }}>Perfil activo</div>
          <div style={{ fontSize: '11px', color: '#8B97BA', marginTop: '4px' }}>Se guarda solo en este navegador para tu cuenta. Puedes dejar campos sin definir.</div>
        </div>
        {!editing && <button type="button" style={button} onClick={beginEdit}>Editar perfil</button>}
      </div>

      {!editing ? (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginTop: '14px' }}>
          {Object.entries(labels).map(([key, label]) => (
            <div key={key} style={field}><div>{label}</div><strong style={{ display: 'block', color: '#E8DDB0', marginTop: '3px', overflowWrap: 'anywhere' }}>{display(profile[key])}{key === 'fingers' && profile.fingers !== null ? ' dedos' : ''}</strong></div>
          ))}
        </div>
      ) : (
        <form onSubmit={handleSubmit} style={{ marginTop: '14px' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
            {Object.entries(labels).map(([key, label]) => (
              <label key={key} style={field}>
                {label}
                {key === 'fingers' ? (
                  <select aria-label={label} style={input} value={draft.fingers ?? ''} onChange={event => setDraft(current => ({ ...current, fingers: event.target.value === '' ? null : Number(event.target.value) }))}>
                    <option value="">Desconocido</option>
                    {[2, 3, 4].map(count => <option key={count} value={count}>{count} dedos</option>)}
                  </select>
                ) : (
                  <input aria-label={label} style={input} type="text" maxLength={key === 'objective' ? 120 : key === 'gameVersion' ? 40 : 80} value={draft[key] ?? ''} placeholder="Desconocido" onChange={event => setDraft(current => ({ ...current, [key]: event.target.value }))} />
                )}
              </label>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '8px', marginTop: '14px' }}>
            <button type="submit" style={button}>Guardar perfil</button>
            <button type="button" style={{ ...button, background: 'transparent', borderColor: '#343149', color: '#AAB2C8' }} onClick={() => { setEditing(false); setError(''); }}>Cancelar</button>
          </div>
        </form>
      )}

      {(error || loadError) && <div role="alert" style={{ color: '#F4A3A3', fontSize: '11px', marginTop: '12px' }}>{error || loadError}</div>}
    </section>
  );
}
