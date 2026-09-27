import { useEffect, useMemo, useState, useCallback } from "react";
import { collection, getDocs } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { db } from "../firebase";
import { readLegacyCatalog } from "../domain/legacyCatalog.js";
import { CatalogNotice, CopyFallback } from "../components/CatalogNotice.jsx";
import { useClipboard } from "../hooks/useClipboard.js";
import { availabilityLabel } from "../domain/configContracts.js";
import { buildSupportMailto } from "../utils/support.js";
import ProfileActive from "../components/ProfileActive.jsx";

// ── TOAST ──────────────────────────────────────────────
function Toast({ visible }) {
  return (
    <div style={{
      position: "fixed",
      bottom: "calc(24px + env(safe-area-inset-bottom, 0px))",
      left: "50%",
      transform: `translateX(-50%) translateY(${visible ? "0" : "20px"})`,
      opacity: visible ? 1 : 0,
      transition: "all 0.3s ease",
      background: "linear-gradient(90deg, #A07010, var(--gold))",
      color: "#000",
      fontFamily: "'Rajdhani', sans-serif",
      fontWeight: 700,
      fontSize: "13px",
      letterSpacing: "1.5px",
      padding: "10px 24px",
      borderRadius: "99px",
      boxShadow: "0 8px 32px rgba(212,160,23,0.35)",
      zIndex: 999,
      pointerEvents: "none",
      whiteSpace: "nowrap",
    }}>
      ✓ CONFIG COPIADA
    </div>
  );
}

// ── BADGE DE GAMA ──────────────────────────────────────

// ── CONFIG ROW ─────────────────────────────────────────
function ConfigRow({ icon, label, value, highlight }) {
  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "8px 12px",
      background: highlight ? "rgba(212,160,23,0.06)" : "var(--surface2)",
      border: `1px solid ${highlight ? "rgba(212,160,23,0.2)" : "var(--border)"}`,
      borderRadius: "6px",
      gap: "8px",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <span style={{ fontSize: "14px" }}>{icon}</span>
        <span style={{ fontSize: "11px", color: "var(--text-muted)", letterSpacing: "0.5px" }}>{label}</span>
      </div>
      <span style={{
        fontFamily: "'Rajdhani', sans-serif",
        fontSize: "13px",
        fontWeight: 700,
        color: highlight ? "var(--gold)" : "var(--text)",
      }}>
        {value ?? "—"}
      </span>
    </div>
  );
}

// ── TIP ITEM ───────────────────────────────────────────
function TipItem({ text }) {
  const clean = text.replace(/^[•-]\s*/, "").trim();
  if (!clean) return null;
  return (
    <div style={{
      display: "flex",
      gap: "8px",
      alignItems: "flex-start",
      fontSize: "12px",
      color: "rgba(232,224,204,0.65)",
      lineHeight: 1.5,
    }}>
      <span style={{ color: "var(--gold-dim)", flexShrink: 0, marginTop: "2px" }}>▸</span>
      <span>{clean}</span>
    </div>
  );
}

// ── CARD DE CONFIG ─────────────────────────────────────
export function ConfigCard({ c, onCopy }) {
  const [expanded, setExpanded] = useState(false);
  const [availability, setAvailability] = useState(c.integrity.availability);
  const tips = c.tips?.split("\n").filter(Boolean) || [];

  return (
    <div className="data-card card-enter" style={{ position: "relative", overflow: "hidden" }}>
      {/* Linha topo */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: "2px",
        background: "linear-gradient(90deg, transparent, var(--gold-dim), transparent)",
      }} />

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "10px", marginBottom: "14px" }}>
        <div style={{ flex: 1 }}>
          <div style={{
            fontFamily: "'Rajdhani', sans-serif",
            fontSize: "17px",
            fontWeight: 700,
            color: "var(--gold)",
            letterSpacing: "0.5px",
            marginBottom: "6px",
          }}>
            {c.brand} {c.model}
          </div>
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", alignItems: "center" }}>

          </div>
        </div>
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <div style={{ fontSize: "9px", color: "var(--text-muted)", letterSpacing: "1px", textTransform: "uppercase" }}>DPI legado · no requerido</div>
          <div style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: "18px", fontWeight: 700, color: "var(--text)" }}>
            {c.integrity.dpi.status === "not_applicable" ? "No aplica" : c.dpi}
          </div>
        </div>
      </div>

      <CatalogNotice record={c} />
      <p style={{ fontSize: "11px", color: "var(--text-muted)" }}>Confirma si cada opción aparece en tu juego. Esta comprobación es temporal y no valida su rendimiento. Si no aparece, conserva tu ajuste actual.</p>
      {/* Seção: Gráficos */}
      <div className="section-header-fh" style={{ marginBottom: "8px" }}>
        <span className="section-label-fh">Gráficos & FPS</span>
        <div className="section-line-fh" />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "14px" }}>
        {[["graphics", "Gráficos", "🎨"], ["highFps", "FPS Alto", "⚡"], ["shadow", "Sombras", "🌑"], ["filters", "Filtro", "🎭"]].map(([key, label, icon]) => (
          <div key={key}>
            <ConfigRow icon={icon} label={label} value={availability[key] === "unavailable" ? "No disponible: conserva tu ajuste" : c[key]} />
            <label style={{ display: "block", fontSize: "11px", color: "var(--text-muted)", margin: "6px 0 10px" }}>
              ¿La opción {label} aparece en tu juego?
              <select aria-label={`Disponibilidad de ${label}`} value={availability[key]} onChange={event => setAvailability(current => ({ ...current, [key]: event.target.value }))} className="fh-select" style={{ width: "100%", marginTop: "4px" }}>
                {["unconfirmed", "available", "unavailable"].map(status => <option key={status} value={status}>{availabilityLabel(status)}</option>)}
              </select>
            </label>
          </div>
        ))}
      </div>

      {/* Seção: Botões */}
      <div className="section-header-fh" style={{ marginBottom: "8px" }}>
        <span className="section-label-fh">Botones de disparo</span>
        <div className="section-line-fh" />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "14px" }}>
        <ConfigRow icon="🎯" label="Botones" value={c.integrity.conflicts.length ? "Revisión pendiente en HUD" : "Consulta la guía de HUD; es la fuente de tamaños"} />
        <details><summary>Ver tamaños legados (archivo, no recomendación)</summary><p>Disparo: {c.fireButton} · Puntería: {c.aimButton}. No aplicar desde Config Pro.</p></details>
      </div>

      {/* Tips */}
      {tips.length > 0 && (
        <details><summary>Archivo original de consejos · Sin revisar</summary>
        <>
          <div className="section-header-fh" style={{ marginBottom: "8px" }}>
            <span className="section-label-fh">Consejos legados · No son instrucciones finales</span>
            <div className="section-line-fh" />
          </div>
          <div style={{
            display: "flex",
            flexDirection: "column",
            gap: "6px",
            marginBottom: "14px",
            padding: "10px 12px",
            background: "rgba(212,160,23,0.04)",
            border: "1px solid rgba(212,160,23,0.1)",
            borderRadius: "8px",
          }}>
            {(expanded ? tips : tips.slice(0, 2)).map((t, i) => (
              <TipItem key={i} text={t} />
            ))}
            {tips.length > 2 && (
              <button
                onClick={() => setExpanded(!expanded)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "var(--gold-dim)",
                  fontSize: "11px",
                  letterSpacing: "1px",
                  textTransform: "uppercase",
                  fontWeight: 700,
                  padding: "4px 0 0",
                  textAlign: "left",
                  cursor: "pointer",
                }}
              >
                {expanded ? "▲ Ver menos" : `▼ +${tips.length - 2} consejos`}
              </button>
            )}
          </div>
        </>
        </details>
      )}

      {/* Nota */}
      {c.notes && (
        <div style={{
          display: "flex",
          gap: "8px",
          alignItems: "flex-start",
          padding: "8px 12px",
          background: "rgba(30,140,74,0.06)",
          border: "1px solid rgba(30,140,74,0.2)",
          borderRadius: "6px",
          marginBottom: "14px",
          fontSize: "11px",
          color: "rgba(232,224,204,0.6)",
          lineHeight: 1.5,
        }}>
          <span style={{ flexShrink: 0 }}>✓</span>
          <span>Nota original sin verificar: {c.notes}</span>
        </div>
      )}

      {/* Botão copiar */}
      <button
        className="btn-copy"
        style={{ width: "100%", justifyContent: "center", gap: "8px" }}
        disabled={c.integrity.conflicts.length > 0}
        title={c.integrity.conflicts.length ? "Copia suspendida hasta la revisión" : "Copiar opciones pendientes de confirmar"}
        onClick={() => onCopy(c, availability)}
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
        </svg>
        COPIAR CONFIG
      </button>
    </div>
  );
}

// ── COMPONENTE PRINCIPAL ───────────────────────────────
export default function Configs() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [brand, setBrand] = useState("Todos");
  const [search, setSearch] = useState("");
  const { toast, manualText, copy, closeManual } = useClipboard();

  const brands = useMemo(() => {
    const set = new Set(items.map((i) => i.brand));
    return ["Todos", ...Array.from(set).sort()];
  }, [items]);

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    return items
      .filter((i) => brand === "Todos" ? true : i.brand === brand)
      .filter((i) => {
        if (!s) return true;
        const haystack = `${i.brand} ${i.model}`.toLowerCase();
        return s.split(/\s+/).every((token) => haystack.includes(token));
      })
      .sort((a, b) => `${a.brand} ${a.model}`.localeCompare(`${b.brand} ${b.model}`));
  }, [items, brand, search]);

  useEffect(() => {
    async function fetchAll() {
      setLoading(true);
      setError("");
      try {
        const snap = await getDocs(collection(db, "configs"));
        setItems(readLegacyCatalog("configs", snap.docs.map((d) => ({ ...d.data(), id: d.id })), { transport: true }));
      } catch (e) {
        console.error(e);
        setError("Error al cargar las configuraciones.");
      } finally {
        setLoading(false);
      }
    }
    fetchAll();
  }, []);

  const handleCopy = useCallback((c, availability = c.integrity.availability) => {
    if (c.integrity.conflicts.length) return;
    const optionText = key => availability[key] === "unavailable" ? "No disponible; conserva tu ajuste" : `${c[key]} (${availabilityLabel(availability[key])}; valor sin validar)`;
    const text =
      `⚙️ Config Pro — ${c.brand} ${c.model}\n` +
      `━━━━━━━━━━━━━━━━\n` +
      `Escala del sistema: conservar la actual; DPI no requerido.\n` +
      `Gráficos:       ${optionText("graphics")}\n` +
      `FPS Alto:       ${optionText("highFps")}\n` +
      `Sombras:        ${optionText("shadow")}\n` +
      `Filtro:         ${optionText("filters")}\n` +
      `Botones: consulta la guía textual de HUD.\n` +
      `━━━━━━━━━━━━━━━━\n` +
      `Opciones sin confirmar en tu versión. Si no están disponibles, conserva tu ajuste actual.\n` +
      `Base sin validación registrada. Aplicación manual. Conserva tu configuración anterior.\nFullHead ⚡`;
    void copy(text);
  }, [copy]);

  return (
    <div className="module-page">
      <Toast visible={toast} />
      <CopyFallback text={manualText} onClose={closeManual} />

      {/* Header */}
      <div className="module-header">
        <button className="module-back-btn" onClick={() => navigate("/")} title="Volver">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>
        <div>
          <div className="module-title">Configuraciones Pro</div>
          <div className="module-subtitle">Base recomendada · Opciones por confirmar</div>
        </div>
      </div>

      <div style={{ padding: "20px 16px 80px" }}>

        <ProfileActive />

        {/* Info banner */}
        <div style={{
          background: "rgba(212,160,23,0.06)",
          border: "1px solid var(--border-gold)",
          borderRadius: "8px",
          padding: "12px 16px",
          marginBottom: "20px",
          fontSize: "12px",
          color: "var(--text-muted)",
          lineHeight: 1.6,
        }}>
          <span style={{ color: "var(--gold)", fontWeight: 700 }}>⚙️ Config Pro:</span>{" "}
          Base recomendada para revisar opciones de gráficos. Confirma su disponibilidad en el juego y prueba un cambio a la vez. No se garantiza un nivel de FPS.
        </div>

        {/* Config Pro para HS */}
        <div style={{
          background: "rgba(192,57,43,0.06)",
          border: "1px solid rgba(192,57,43,0.25)",
          borderRadius: "8px",
          padding: "12px 16px",
          marginBottom: "20px",
          fontSize: "12px",
          color: "var(--text-muted)",
          lineHeight: 1.6,
        }}>
          <span style={{ color: "#E57373", fontWeight: 700 }}>🎯 Sensibilidad y HUD:</span>{" "}
          Consulta los tamaños de botones en la guía de HUD. Conserva la sensibilidad mientras pruebas un cambio de botón para distinguir sus efectos. No hay resultados garantizados.
        </div>

        {/* Filtros */}
        <div style={{ display: "flex", gap: "8px", marginBottom: "10px", flexWrap: "wrap" }}>
          <select
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
            className="fh-select"
            style={{ flex: "1", minWidth: "130px", maxWidth: "180px" }}
          >
            {brands.map((b) => <option key={b} value={b}>{b}</option>)}
          </select>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar modelo..."
            className="fh-input"
            style={{ flex: "2", minWidth: "150px" }}
          />
        </div>

        <div style={{ marginBottom: "16px" }}>
          <span className="count-tag">
            {loading ? "Cargando..." : `${filtered.length} configuración(es)`}
          </span>
        </div>

        {/* Erro */}
        {error && (
          <div style={{
            marginBottom: "16px",
            padding: "12px 16px",
            background: "rgba(192,57,43,0.1)",
            border: "1px solid rgba(192,57,43,0.4)",
            borderRadius: "6px",
            fontSize: "12px",
            color: "#e57373",
          }}>
            {error}
          </div>
        )}

        {/* Lista */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "60px 0" }}>
            <div style={{ fontSize: "28px", marginBottom: "12px" }}>⚙️</div>
            <div className="loading-text">Cargando configuraciones...</div>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 0" }}>
            <div style={{ fontSize: "28px", marginBottom: "12px" }}>📱</div>
            <div className="loading-text">No se encontró tu modelo.</div>
            <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "8px" }}>
              Busca solo la marca para ver todos los modelos
            </div>
            <a
              href={buildSupportMailto(search ? `${brand !== "Todos" ? brand + " " : ""}${search}` : "")}
              style={{
                display: "inline-flex", alignItems: "center", gap: "6px",
                marginTop: "16px", padding: "9px 16px", borderRadius: "8px",
                background: "rgba(212,160,23,0.08)", border: "1px solid var(--border-gold)",
                color: "var(--gold)", fontSize: "12px", fontWeight: 700,
                textDecoration: "none",
              }}
            >
              📩 Avisar a soporte sobre mi modelo
            </a>
          </div>
        ) : (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
            gap: "12px",
          }}>
            {filtered.map((c, i) => (
              <div key={c.id} style={{ animationDelay: `${i * 0.04}s` }}>
                <ConfigCard c={c} onCopy={handleCopy} />
              </div>
            ))}
          </div>
        )}

        {/* Pro tip */}
        {!loading && filtered.length > 0 && (
          <div style={{
            marginTop: "32px",
            padding: "14px 16px",
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: "8px",
            fontSize: "11px",
            color: "var(--text-muted)",
            lineHeight: 1.7,
          }}>
            <span style={{ color: "var(--gold)", fontWeight: 700 }}>💡 Pro tip:</span>{" "}
            Revisa qué opciones existen en tu versión de Free Fire. Conserva tus valores anteriores y prueba un cambio a la vez; no es necesario modificar ajustes avanzados de Android.
          </div>
        )}
      </div>
    </div>
  );
}
