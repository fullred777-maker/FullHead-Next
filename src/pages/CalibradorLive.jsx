import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { collection, getDocs, addDoc, deleteDoc, doc, query, where, serverTimestamp } from "firebase/firestore";
import { db, auth } from "../firebase";
import { readLegacyCatalog } from "../domain/legacyCatalog.js";
import { SENSITIVITY_FIELDS, sensitivitySnapshot, changeSensitivity, saveSensitivitySnapshot } from "../domain/configContracts.js";

// ── ESTILOS GLOBAIS ────────────────────────────────────
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Rajdhani:wght@500;600;700&family=Bebas+Neue&display=swap');

  @keyframes pulse-gold {
    0%,100% { box-shadow: 0 0 0 0 rgba(212,160,23,0.4); }
    50% { box-shadow: 0 0 0 8px rgba(212,160,23,0); }
  }
  @keyframes glow-in {
    from { opacity:0; transform:translateY(10px); }
    to { opacity:1; transform:translateY(0); }
  }
  @keyframes slide-up {
    from { transform:translateY(16px); opacity:0; }
    to { transform:translateY(0); opacity:1; }
  }
  @keyframes row-in {
    from { opacity:0; transform:translateX(-8px); }
    to { opacity:1; transform:translateX(0); }
  }
  .cl-row { animation: row-in 0.3s ease both; }
  .cl-section { animation: glow-in 0.4s ease both; }
  .cl-log-line { animation: glow-in 0.2s ease both; }
  @keyframes scan-spin { to { transform: rotate(360deg); } }
  @keyframes scan-pulse { 0%,100% { opacity:0.4; } 50% { opacity:1; } }
`;

const SLIDER_FIELDS = SENSITIVITY_FIELDS;

// Browser rendering estimate only; never identifies device hardware or game FPS.
function measureRefreshRate(onDone) {
  let frames = 0;
  const start = performance.now();
  function tick() {
    if (document.visibilityState === "hidden") { onDone(null); return; }
    frames++;
    const elapsed = performance.now() - start;
    if (elapsed < 1200) requestAnimationFrame(tick);
    else onDone(Math.round(frames / elapsed * 1000));
  }
  requestAnimationFrame(tick);
}

function SectionBlock({ title, icon, color, borderColor, bgColor, children, delay = "0s" }) {
  return (
    <div className="cl-section" style={{
      animationDelay: delay,
      background: `linear-gradient(135deg, ${bgColor} 0%, rgba(10,10,10,0) 60%)`,
      border: `1px solid ${borderColor}`,
      borderRadius: "12px",
      overflow: "hidden",
      marginBottom: "12px",
      position: "relative",
    }}>
      <div style={{
        position: "absolute", left: 0, top: 0, bottom: 0,
        width: "3px",
        background: `linear-gradient(to bottom, ${color}, ${color}44)`,
      }}/>
      <div style={{
        display: "flex", alignItems: "center", gap: "10px",
        padding: "10px 14px 10px 18px",
        borderBottom: `1px solid ${borderColor}`,
        background: `${bgColor}`,
      }}>
        <span style={{ fontSize: "14px" }}>{icon}</span>
        <span style={{
          fontFamily: "'Share Tech Mono', monospace",
          fontSize: "11px",
          letterSpacing: "3px",
          color,
          textTransform: "uppercase",
        }}>{title}</span>
        <div style={{ flex: 1 }}/>
        <div style={{
          width: "6px", height: "6px",
          borderRadius: "50%",
          background: color,
          boxShadow: `0 0 8px ${color}`,
          animation: "pulse-gold 2s infinite",
        }}/>
      </div>
      <div style={{ padding: "14px" }}>
        {children}
      </div>
    </div>
  );
}

export function LiveSlider({ field, value, onChange }) {
  const pct = value == null ? 0 : Math.min((value / field.max) * 100, 100);
  return (
    <div className="cl-row" style={{ marginBottom: "16px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
        <span style={{
          fontFamily: "'Rajdhani', sans-serif", fontSize: "13px", fontWeight: 700,
          color: "var(--text)", letterSpacing: "0.5px",
        }}>{field.label}</span>
        <span style={{
          fontFamily: "'Share Tech Mono', monospace", fontSize: "13px", fontWeight: 700,
          color: field.color,
        }}>{value ?? "Sin base"}</span>
      </div>
      <div style={{ position: "relative", height: "22px", display: "flex", alignItems: "center" }}>
        <div style={{ position: "absolute", left: 0, right: 0, height: "3px", background: "rgba(255,255,255,0.06)", borderRadius: "2px" }}/>
        <div style={{
          position: "absolute", left: 0, height: "3px", width: `${pct}%`,
          background: `linear-gradient(90deg, ${field.color}88, ${field.color})`,
          borderRadius: "2px", boxShadow: `0 0 8px ${field.color}66`, transition: "width 0.1s",
        }}/>
        <input
          aria-label={field.label}
          disabled={!field.editable || value == null}
          type="range" min={field.min} max={field.max} step={field.step} value={value ?? field.min}
          onChange={(e) => onChange(field.key, Number(e.target.value))}
          style={{ position: "absolute", left: 0, right: 0, width: "100%", height: "22px", opacity: 0, cursor: "pointer", margin: 0 }}
        />
        <div style={{
          position: "absolute", left: `calc(${pct}% - 9px)`,
          width: "18px", height: "18px", borderRadius: "50%",
          background: `linear-gradient(135deg, ${field.color}cc, ${field.color})`,
          border: "2px solid #060608",
          boxShadow: `0 0 10px ${field.color}88`,
          pointerEvents: "none", transition: "left 0.05s",
        }}/>
      </div>
      {!field.editable && <p style={{ fontSize: "11px", color: "var(--text-muted)" }}>Solo lectura: conservamos el valor original de Mirada Libre hasta confirmar su contrato de edición.</p>}
    </div>
  );
}

// ── PREVIEW: simulación de referencia (no representa el juego exacto) ──
function SensiPreview({ general }) {
  const areaRef = useRef(null);
  const [pos, setPos] = useState({ x: 50, y: 50 });
  const dragging = useRef(false);
  const last = useRef(null);

  const handleMove = useCallback((clientX, clientY) => {
    if (!dragging.current || !last.current || !areaRef.current) return;
    const rect = areaRef.current.getBoundingClientRect();
    const dx = clientX - last.current.x;
    const dy = clientY - last.current.y;
    const factor = 0.3 + (general / SENSITIVITY_FIELDS.find(field => field.key === "general").max) * 1.4; // referencia ilustrativa, no física del juego
    setPos((p) => {
      const nx = Math.min(95, Math.max(5, p.x + (dx / rect.width) * 100 * factor));
      const ny = Math.min(95, Math.max(5, p.y + (dy / rect.height) * 100 * factor));
      return { x: nx, y: ny };
    });
    last.current = { x: clientX, y: clientY };
  }, [general]);

  const start = (x, y) => { dragging.current = true; last.current = { x, y }; };
  const end = () => { dragging.current = false; last.current = null; };

  return (
    <div>
      <div
        ref={areaRef}
        onMouseDown={(e) => start(e.clientX, e.clientY)}
        onMouseMove={(e) => handleMove(e.clientX, e.clientY)}
        onMouseUp={end}
        onMouseLeave={end}
        onTouchStart={(e) => start(e.touches[0].clientX, e.touches[0].clientY)}
        onTouchMove={(e) => handleMove(e.touches[0].clientX, e.touches[0].clientY)}
        onTouchEnd={end}
        style={{
          position: "relative", width: "100%", height: "150px",
          background: "#040406", borderRadius: "10px",
          border: "1px solid rgba(255,255,255,0.08)",
          overflow: "hidden", touchAction: "none", cursor: "grab",
        }}
      >
        {/* grid de fundo */}
        <svg width="100%" height="100%" style={{ position: "absolute", inset: 0, opacity: 0.15 }}>
          <defs>
            <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#D4A017" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
        {/* crosshair */}
        <div style={{
          position: "absolute",
          left: `${pos.x}%`, top: `${pos.y}%`,
          transform: "translate(-50%,-50%)",
          width: "22px", height: "22px",
          transition: "left 0.03s, top 0.03s",
        }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#D4A017" strokeWidth="2">
            <circle cx="12" cy="12" r="9" opacity="0.5"/>
            <line x1="12" y1="2" x2="12" y2="7"/><line x1="12" y1="17" x2="12" y2="22"/>
            <line x1="2" y1="12" x2="7" y2="12"/><line x1="17" y1="12" x2="22" y2="12"/>
          </svg>
        </div>
        <div style={{
          position: "absolute", bottom: "8px", left: "10px", right: "10px",
          fontFamily: "'Share Tech Mono', monospace", fontSize: "9px",
          color: "rgba(255,255,255,0.3)", letterSpacing: "0.5px",
        }}>
          Arrastra para probar — simulación de referencia proporcional al valor "General"
        </div>
      </div>
    </div>
  );
}

export default function CalibradorLive() {
  const navigate = useNavigate();

  const [brand, setBrand] = useState("Todos");
  const [search, setSearch] = useState("");
  const [presets, setPresets] = useState([]);
  const [loadingPresets, setLoadingPresets] = useState(true);
  const [selectedBase, setSelectedBase] = useState(null);

  const [values, setValues] = useState(null);
  const [profileName, setProfileName] = useState("");
  const [saving, setSaving] = useState(false);
  const [savedProfiles, setSavedProfiles] = useState([]);
  const [loadingSaved, setLoadingSaved] = useState(true);
  const [log, setLog] = useState([]);
  const logRef = useRef(null);

  // Estimación del navegador
  const [detecting, setDetecting] = useState(false);
  const [detectedHz, setDetectedHz] = useState(null);


  const pushLog = (msg, type = "info") => {
    const ts = new Date().toLocaleTimeString("es-ES", { hour12: false });
    setLog((l) => [...l, { ts, msg, type }]);
    setTimeout(() => { logRef.current?.scrollTo({ top: logRef.current.scrollHeight }); }, 30);
  };

  useEffect(() => {
    (async () => {
      try {
        const snap = await getDocs(collection(db, "presets"));
        setPresets(readLegacyCatalog("presets", snap.docs.map((d) => ({ ...d.data(), id: d.id })), { transport: true }));
      } catch {
        pushLog("✗ Error al cargar los aparatos base.", "error");
      } finally {
        setLoadingPresets(false);
      }
    })();
    loadSavedProfiles();
    pushLog("█ Calibrador listo. Elige un punto de partida o ajusta manualmente.");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadSavedProfiles() {
    const user = auth.currentUser;
    if (!user) { setLoadingSaved(false); return; }
    try {
      const q = query(collection(db, "perfiles_personalizados"), where("uid", "==", user.uid));
      const snap = await getDocs(q);
      const saved = snap.docs.map(d => ({ ...d.data(), id: d.id }));
      const valid = saved.filter(p => {
        try { sensitivitySnapshot(p); return true; }
        catch { pushLog("Un ajuste guardado contiene valores inválidos. No se modificó ni eliminó.", "error"); return false; }
      });
      setSavedProfiles(valid);
    } catch {
      pushLog("✗ No se pudieron cargar tus perfiles guardados.", "error");
    } finally {
      setLoadingSaved(false);
    }
  }

  const brands = ["Todos", ...Array.from(new Set(presets.map((p) => p.brand))).sort()];
  const filtered = presets
    .filter((p) => brand === "Todos" ? true : p.brand === brand)
    .filter((p) => {
      const s = search.trim().toLowerCase();
      if (!s) return true;
      const haystack = `${p.brand} ${p.model} ${p.profile}`.toLowerCase();
      return s.split(/\s+/).every((token) => haystack.includes(token));
    })
    .sort((a, b) => `${a.brand} ${a.model}`.localeCompare(`${b.brand} ${b.model}`));

  function loadBase(p) {
    setSelectedBase(p);
    setValues(sensitivitySnapshot(p));
    pushLog(`✓ Punto de partida cargado: ${p.brand} ${p.model} (${p.profile})`);
  }

  function handleSliderChange(key, val) {
    try { setValues(changeSensitivity(values, key, val)); }
    catch (error) { pushLog(error.message, "error"); }
  }

  function handleDetectScreen() {
    setDetecting(true);
    setDetectedHz(null);
    pushLog("📡 Estimando la renderización del navegador...");
    measureRefreshRate(raw => {
      setDetecting(false);
      setDetectedHz(raw);
      pushLog(raw === null ? "Medición interrumpida: mantén la página visible." : `Estimación: ${raw} cuadros/s en el navegador; no mide el juego.`);
    });
  }

  async function handleSave() {
    if (!values) { pushLog("Elige una base antes de guardar.", "error"); return; }
    const user = auth.currentUser;
    if (!user) { pushLog("✗ Necesitas iniciar sesión para guardar.", "error"); return; }
    const name = profileName.trim() || `Ajuste ${new Date().toLocaleDateString("es-ES")}`;
    setSaving(true);
    pushLog(`… Guardando "${name}"...`);
    try {
      await saveSensitivitySnapshot(values, snapshot => addDoc(collection(db, "perfiles_personalizados"), {
        uid: user.uid,
        nombre: name,
        baseBrand: selectedBase?.brand || null,
        baseModel: selectedBase?.model || null,
        ...snapshot,
        createdAt: serverTimestamp(),
      }));
      pushLog(`✓ "${name}" guardado en tu cuenta.`, "success");
      setProfileName("");
      loadSavedProfiles();
    } catch {
      pushLog("✗ Error al guardar. Intenta de nuevo.", "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteSaved(id, name) {
    try {
      await deleteDoc(doc(db, "perfiles_personalizados", id));
      setSavedProfiles((list) => list.filter((p) => p.id !== id));
      pushLog(`✓ "${name}" eliminado.`);
    } catch {
      pushLog("✗ No se pudo eliminar.", "error");
    }
  }

  function loadSavedIntoSliders(p) {
    setValues(sensitivitySnapshot(p));
    setSelectedBase(p.baseBrand ? { brand: p.baseBrand, model: p.baseModel, profile: "" } : null);
    pushLog(`✓ Perfil "${p.nombre}" cargado en los sliders.`);
  }

  const logColors = { info: "rgba(255,255,255,0.5)", success: "#1E8C4A", error: "#C0392B" };

  return (
    <div className="module-page" style={{ overflowY: "auto", paddingBottom: "100px" }}>
      <style>{STYLES}</style>

      <div className="module-header">
        <button className="module-back-btn" onClick={() => navigate("/")} title="Volver">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>
        <div>
          <div className="module-title">Calibrador en Vivo</div>
          <div className="module-subtitle">Ajusta, prueba y guarda tu sensibilidad personalizada</div>
        </div>
      </div>

      <div style={{ padding: "20px 16px 20px", maxWidth: "720px", margin: "0 auto" }}>

        {/* Info banner */}
        <div style={{
          background: "rgba(212,160,23,0.06)",
          border: "1px solid var(--border-gold)",
          borderRadius: "8px",
          padding: "12px 16px",
          marginBottom: "16px",
          fontSize: "12px",
          color: "var(--text-muted)",
          lineHeight: 1.6,
        }}>
          <span style={{ color: "var(--gold)", fontWeight: 700 }}>⚡ Cómo funciona:</span>{" "}
          Elige una recomendación de partida y crea un ajuste personalizable. Conserva tus valores actuales. La vista previa ayuda a comparar los cambios; los resultados se evalúan directamente en Free Fire. Mirada Libre se conserva sin cambios.
        </div>

        {/* Estimación del navegador */}
        <SectionBlock title="Estimación del navegador" icon="📡" color="#27AE60" borderColor="rgba(39,174,96,0.3)" bgColor="rgba(39,174,96,0.04)">
          {!detectedHz && !detecting && (
            <>
              <p style={{ fontSize: "12px", color: "var(--text-muted)", lineHeight: 1.6, marginBottom: "12px" }}>
                Estimamos cuadros por segundo de esta página. No identifica tu dispositivo, sus Hz físicos ni los FPS de Free Fire.
              </p>
              <button
                onClick={handleDetectScreen}
                style={{
                  width: "100%", padding: "12px", borderRadius: "8px",
                  border: "1px solid rgba(39,174,96,0.4)", background: "rgba(39,174,96,0.1)",
                  color: "#27AE60", fontFamily: "'Rajdhani', sans-serif", fontWeight: 700,
                  fontSize: "14px", letterSpacing: "1px", cursor: "pointer",
                }}
              >
                📡 ESTIMAR RENDERIZACIÓN
              </button>
            </>
          )}

          {detecting && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "20px 0" }}>
              <div style={{
                width: "56px", height: "56px", borderRadius: "50%", position: "relative", marginBottom: "14px",
              }}>
                <div style={{
                  position: "absolute", inset: 0, borderRadius: "50%",
                  border: "3px solid rgba(39,174,96,0.15)",
                }}/>
                <div style={{
                  position: "absolute", inset: 0, borderRadius: "50%",
                  border: "3px solid transparent", borderTopColor: "#27AE60",
                  animation: "scan-spin 0.8s linear infinite",
                }}/>
                <div style={{
                  position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "20px", animation: "scan-pulse 1s ease infinite",
                }}>📡</div>
              </div>
              <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: "12px", color: "#27AE60", letterSpacing: "1px" }}>
                Midiendo cuadros por segundo...
              </div>
            </div>
          )}

          {detectedHz && !detecting && (
            <div>
              <div style={{
                display: "flex", alignItems: "center", gap: "14px",
                padding: "14px 16px", borderRadius: "10px",
                background: "rgba(39,174,96,0.08)", border: "1px solid rgba(39,174,96,0.25)",
                marginBottom: "10px",
              }}>
                <div style={{
                  fontFamily: "'Bebas Neue', sans-serif", fontSize: "32px", color: "#27AE60", lineHeight: 1,
                }}>{detectedHz}<span style={{ fontSize: "14px" }}> cuadros/s</span></div>
                <div style={{ fontSize: "11px", color: "var(--text-muted)", lineHeight: 1.5 }}>
                  Estimación local del navegador<br/>
                  <span style={{ opacity: 0.6 }}>No se usa para recomendar valores.</span>
                </div>
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  onClick={handleDetectScreen}
                  title="Medir de nuevo"
                  style={{
                    padding: "10px 14px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.1)",
                    background: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: "12px",
                  }}
                >
                  ↻
                </button>
              </div>
            </div>
          )}
        </SectionBlock>

        {/* Punto de partida */}
        <SectionBlock title="Punto de Partida" icon="📱" color="#D4A017" borderColor="var(--border-gold)" bgColor="rgba(212,160,23,0.04)">
          <div style={{ display: "flex", gap: "8px", marginBottom: "10px", flexWrap: "wrap" }}>
            <select value={brand} onChange={(e) => setBrand(e.target.value)} className="fh-select" style={{ flex: 1, minWidth: "120px", maxWidth: "170px" }}>
              {brands.map((b) => <option key={b} value={b}>{b}</option>)}
            </select>
            <input
              value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar modelo..." className="fh-input" style={{ flex: 2, minWidth: "140px" }}
            />
          </div>
          <div style={{ maxHeight: "180px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "6px" }}>
            {loadingPresets ? (
              <div style={{ fontSize: "12px", color: "var(--text-muted)", padding: "8px 0" }}>Cargando aparatos...</div>
            ) : filtered.length === 0 ? (
              <div style={{ fontSize: "12px", color: "var(--text-muted)", padding: "8px 0", textAlign: "center" }}>
                No se encontró una base. No asumas compatibilidad con otro modelo.
              </div>
            ) : filtered.slice(0, 30).map((p) => (
              <div
                key={p.id}
                onClick={() => loadBase(p)}
                style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "8px 10px", borderRadius: "6px", cursor: "pointer",
                  background: selectedBase?.id === p.id ? "rgba(212,160,23,0.1)" : "transparent",
                  border: `1px solid ${selectedBase?.id === p.id ? "var(--border-gold)" : "transparent"}`,
                  fontSize: "12px",
                }}
              >
                <span style={{ color: "var(--text)" }}>{p.brand} {p.model} <span style={{ color: "var(--text-muted)" }}>· {p.profile}</span></span>
                {selectedBase?.id === p.id && <span style={{ color: "var(--gold)" }}>✓</span>}
              </div>
            ))}
          </div>
        </SectionBlock>

        {/* Ajuste fino */}
        <SectionBlock title="Ajuste Fino" icon="🎚️" color="#1A6FA8" borderColor="rgba(26,111,168,0.3)" bgColor="rgba(26,111,168,0.04)">
          {SLIDER_FIELDS.map((f) => (
            <LiveSlider key={f.key} field={f} value={values?.[f.key]} onChange={handleSliderChange} />
          ))}
        </SectionBlock>

        {/* Vista previa */}
        <SectionBlock title="Vista Previa" icon="🎯" color="#1E8C4A" borderColor="rgba(30,140,74,0.3)" bgColor="rgba(30,140,74,0.04)">
          {values ? <SensiPreview general={values.general} /> : <p>Selecciona una base para ver la referencia.</p>}
        </SectionBlock>

        {/* Guardar */}
        <SectionBlock title="Guardar Mi Ajuste" icon="💾" color="#8E44AD" borderColor="rgba(142,68,173,0.3)" bgColor="rgba(142,68,173,0.04)">
          <input
            value={profileName}
            onChange={(e) => setProfileName(e.target.value)}
            placeholder="Nombre de tu perfil (ej: Mi Config Rankeada)"
            className="fh-input"
            style={{ width: "100%", marginBottom: "10px" }}
          />
          <button
            onClick={handleSave}
            disabled={saving || !values}
            style={{
              width: "100%", padding: "12px", borderRadius: "8px", border: "none",
              background: saving ? "rgba(212,160,23,0.15)" : "linear-gradient(90deg,#8A6610,#D4A017,#F0C040,#D4A017)",
              color: saving ? "rgba(212,160,23,0.5)" : "#000",
              fontFamily: "'Bebas Neue', sans-serif", fontSize: "16px", letterSpacing: "2px",
              cursor: saving ? "not-allowed" : "pointer",
            }}
          >
            {saving ? "GUARDANDO..." : "GUARDAR MI AJUSTE"}
          </button>
        </SectionBlock>

        {/* Mis perfiles guardados */}
        {(loadingSaved || savedProfiles.length > 0) && (
          <SectionBlock title="Mis Perfiles Guardados" icon="⭐" color="#E67E22" borderColor="rgba(230,126,34,0.3)" bgColor="rgba(230,126,34,0.04)">
            {loadingSaved ? (
              <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>Cargando tus perfiles...</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {savedProfiles.map((p) => (
                  <div key={p.id} style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    padding: "10px 12px", borderRadius: "6px",
                    background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)",
                  }}>
                    <div>
                      <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--text)" }}>{p.nombre}</div>
                      <div style={{ fontSize: "10px", color: "var(--text-muted)" }}>General {p.general} · Red Dot {p.redDot}</div>
                    </div>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button onClick={() => loadSavedIntoSliders(p)} style={{ fontSize: "10px", color: "var(--gold)", background: "none", border: "1px solid var(--border-gold)", borderRadius: "6px", padding: "5px 10px", cursor: "pointer" }}>CARGAR</button>
                      <button onClick={() => handleDeleteSaved(p.id, p.nombre)} style={{ fontSize: "10px", color: "#C0392B", background: "none", border: "1px solid rgba(192,57,43,0.3)", borderRadius: "6px", padding: "5px 10px", cursor: "pointer" }}>BORRAR</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SectionBlock>
        )}

        {/* Log de actividad */}
        <div className="cl-section" style={{
          background: "#040406", border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: "12px", overflow: "hidden", marginBottom: "8px",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "9px 14px", borderBottom: "1px solid rgba(255,255,255,0.04)", background: "rgba(255,255,255,0.02)" }}>
            <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: "10px", letterSpacing: "2px", color: "rgba(255,255,255,0.3)", textTransform: "uppercase" }}>
              Registro de Actividad
            </span>
          </div>
          <div ref={logRef} style={{ padding: "12px 14px", maxHeight: "140px", overflowY: "auto", fontFamily: "'Share Tech Mono', monospace", fontSize: "11px", lineHeight: 1.8 }}>
            {log.map((l, i) => (
              <div key={i} className="cl-log-line" style={{ color: logColors[l.type] || "rgba(255,255,255,0.5)" }}>
                <span style={{ color: "rgba(255,255,255,0.2)" }}>[{l.ts}]</span> {l.msg}
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
