export function CatalogNotice({ record }) {
  const pending = record.integrity?.conflicts?.length > 0;
  return (
    <div style={{ padding: '10px 12px', marginBottom: '12px', borderRadius: '8px', border: '1px solid var(--border-gold)', background: 'rgba(212,160,23,0.06)', color: 'var(--text)', fontSize: '11px', lineHeight: 1.6 }}>
      <strong>{pending ? 'Revisión pendiente · Sin validación registrada' : 'Base recomendada · Sin validación registrada'}</strong>
      <div>{pending ? 'Hay instrucciones contradictorias entre HUD y Config Pro. No apliques sus tamaños de botones ni consejos hasta la revisión.' : 'Punto de partida para probar manualmente. Compatibilidad con tu variante sin confirmar.'}</div>
      <div>Hz del dispositivo: desconocidos. Conserva la escala actual del sistema; cambiar DPI no es un requisito.</div>
    </div>
  );
}

export function CopyFallback({ text, onClose }) {
  if (!text) return null;
  return (
    <section role="alert" style={{ position: 'fixed', inset: '15% 16px auto', maxHeight: '70vh', overflow: 'auto', maxWidth: '600px', margin: 'auto', zIndex: 1100, padding: '20px', background: '#0C0E18', border: '1px solid var(--gold)', borderRadius: '12px', color: 'var(--text)' }}>
      <p>No se pudo copiar. Selecciona el texto y cópialo manualmente.</p>
      <textarea aria-label="Texto para copiar manualmente" readOnly value={text} onFocus={event => event.target.select()} style={{ width: '100%', minHeight: '200px', background: '#080A10', color: '#E8DDB0' }} />
      <button type="button" className="btn-copy" onClick={onClose}>Cerrar</button>
    </section>
  );
}
