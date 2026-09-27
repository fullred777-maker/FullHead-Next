import { useEffect, useMemo, useState, useCallback } from "react";
import { collection, getDocs } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { db } from "../firebase";
import { readLegacyCatalog } from "../domain/legacyCatalog.js";
import { CatalogNotice, CopyFallback } from "../components/CatalogNotice.jsx";
import { useClipboard } from "../hooks/useClipboard.js";
import { fingerCount } from "../domain/configContracts.js";
import { buildSupportMailto } from "../utils/support.js";

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
      ✓ GUÍA COPIADA
    </div>
  );
}

// ── BADGE DE DEDOS ─────────────────────────────────────
export function FingersBadge({ fingers }) {
  const count = fingerCount(fingers);
  const is3 = count === 3;
  return (
    <span style={{
      display: "inline-flex",
      alignItems: "center",
      gap: "4px",
      background: is3 ? "rgba(192,57,43,0.1)" : "rgba(26,111,168,0.1)",
      border: `1px solid ${is3 ? "rgba(192,57,43,0.3)" : "rgba(26,111,168,0.3)"}`,
      color: is3 ? "#C0392B" : "#1A6FA8",
      fontSize: "9px",
      fontWeight: 700,
      letterSpacing: "1.5px",
      padding: "2px 8px",
      borderRadius: "3px",
      textTransform: "uppercase",
    }}>
      {count === null ? "DEDOS DESCONOCIDOS" : count + " DEDOS"}
    </span>
  );
}

// ── BADGE DE GAMA ──────────────────────────────────────

// ── STEP ITEM ──────────────────────────────────────────
function StepItem({ text }) {
  const clean = text.replace(/^[•-]\s*/, "").trim();
  if (!clean) return null;

  const isDica = clean.toLowerCase().startsWith("dica");
  const parts = clean.split(":");
  const key = parts.length > 1 ? parts[0] : null;
  const val = parts.length > 1 ? parts.slice(1).join(":").trim() : clean;

  if (isDica) {
    return (
      <div style={{
        display: "flex",
        gap: "8px",
        alignItems: "flex-start",
        padding: "10px 12px",
        background: "rgba(212,160,23,0.06)",
        border: "1px solid rgba(212,160,23,0.15)",
        borderRadius: "6px",
        marginTop: "4px",
      }}>
        <span style={{ fontSize: "14px", flexShrink: 0 }}>💡</span>
        <span style={{ fontSize: "12px", color: "rgba(232,224,204,0.7)", lineHeight: 1.5 }}>{val}</span>
      </div>
    );
  }

  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "8px 12px",
      background: "var(--surface2)",
      border: "1px solid var(--border)",
      borderRadius: "6px",
      gap: "12px",
    }}>
      {key ? (
        <>
          <span style={{ fontSize: "12px", color: "var(--text-muted)", flexShrink: 0 }}>{key}</span>
          <span style={{
            fontFamily: "'Rajdhani', sans-serif",
            fontSize: "13px",
            fontWeight: 700,
            color: "var(--text)",
            textAlign: "right",
          }}>{val}</span>
        </>
      ) : (
        <span style={{ fontSize: "12px", color: "var(--text)", lineHeight: 1.4 }}>{clean}</span>
      )}
    </div>
  );
}

// ── CARD DE HUD ────────────────────────────────────────
export function HudCard({ h, onCopy }) {
  const [expanded, setExpanded] = useState(false);
  const steps = h.steps?.split("\n").filter(Boolean) || [];

  return (
    <div className="data-card card-enter" style={{ position: "relative", overflow: "hidden" }}>
      {/* Linha topo */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: "2px",
        background: "linear-gradient(90deg, transparent, var(--gold-dim), transparent)",
      }} />

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "10px", marginBottom: "12px" }}>
        <div style={{ flex: 1 }}>
          <div style={{
            fontFamily: "'Rajdhani', sans-serif",
            fontSize: "17px",
            fontWeight: 700,
            color: "var(--gold)",
            letterSpacing: "0.5px",
            marginBottom: "6px",
          }}>
            {h.brand} {h.model}
          </div>
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", alignItems: "center" }}>
            <FingersBadge fingers={h.fingers} />

          </div>
        </div>

        {/* Ícone de dispositivo */}
        <div style={{
          width: "40px", height: "40px",
          borderRadius: "8px",
          background: "var(--surface2)",
          border: "1px solid var(--border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "20px",
          flexShrink: 0,
        }}>
          {h.brand === "Apple" ? "🍎" : "📱"}
        </div>
      </div>

      <CatalogNotice record={h} />
      <div style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "10px" }}>Archivo original sin revisar. Las instrucciones siguientes no acreditan pruebas en tu dispositivo.</div>
      {/* Descrição */}
      <div style={{
        fontSize: "12px",
        color: "rgba(232,224,204,0.6)",
        lineHeight: 1.6,
        marginBottom: "14px",
        padding: "10px 12px",
        background: "var(--surface2)",
        borderRadius: "6px",
        border: "1px solid var(--border)",
      }}>
        {h.description}
      </div>

      {/* Steps label */}
      <div className="section-header-fh" style={{ marginBottom: "10px" }}>
        <span className="section-label-fh">Guía textual de HUD</span>
        <div className="section-line-fh" />
      </div>

      {/* Steps */}
      <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "14px" }}>
        {(expanded ? steps : steps.slice(0, 4)).map((s, i) => (
          <StepItem key={i} text={s} />
        ))}
      </div>

      {/* Ver más */}
      {steps.length > 4 && (
        <button
          onClick={() => setExpanded(!expanded)}
          style={{
            width: "100%",
            background: "transparent",
            border: "1px solid var(--border)",
            borderRadius: "6px",
            padding: "8px",
            color: "var(--text-muted)",
            fontSize: "11px",
            letterSpacing: "1px",
            textTransform: "uppercase",
            fontWeight: 700,
            marginBottom: "14px",
            transition: "all 0.2s",
          }}
          onMouseEnter={e => { e.target.style.borderColor = "var(--border-gold)"; e.target.style.color = "var(--gold)"; }}
          onMouseLeave={e => { e.target.style.borderColor = "var(--border)"; e.target.style.color = "var(--text-muted)"; }}
        >
          {expanded ? "▲ Ver menos" : `▼ Ver más ${steps.length - 4} pasos`}
        </button>
      )}

      {/* Nota */}
      {h.notes && (
        <div style={{
          display: "flex",
          gap: "8px",
          alignItems: "flex-start",
          padding: "8px 12px",
          background: "rgba(30,140,74,0.06)",
          border: "1px solid rgba(30,140,74,0.2)",
          borderRadius: "6px",
          marginBottom: "14px",
        }}>
          <span style={{ fontSize: "13px", flexShrink: 0 }}>✓</span>
          <span style={{ fontSize: "11px", color: "rgba(232,224,204,0.6)", lineHeight: 1.5 }}>{h.notes}</span>
        </div>
      )}

      {/* Botão copiar */}
      <button
        className="btn-copy"
        style={{ width: "100%", justifyContent: "center", gap: "8px" }}
        disabled={h.integrity.conflicts.length > 0}
        title={h.integrity.conflicts.length ? "Copia suspendida hasta resolver las instrucciones contradictorias" : "Copiar instrucciones como texto"}
        onClick={() => onCopy(h)}
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
        </svg>
        COPIAR GUÍA
      </button>
    </div>
  );
}

// ── COMPONENTE PRINCIPAL ───────────────────────────────
export default function Hud() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [brand, setBrand] = useState("Todos");
  const [search, setSearch] = useState("");
  const [fingers, setFingers] = useState("Todos");
  const { toast, manualText, copy, closeManual } = useClipboard();

  const brands = useMemo(() => {
    const set = new Set(items.map((i) => i.brand));
    return ["Todos", ...Array.from(set).sort()];
  }, [items]);

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    return items
      .filter((i) => brand === "Todos" ? true : i.brand === brand)
      .filter((i) => fingers === "Todos" ? true : fingerCount(i.fingers) === Number(fingers))
      .filter((i) => {
        if (!s) return true;
        const haystack = `${i.brand} ${i.model}`.toLowerCase();
        return s.split(/\s+/).every((token) => haystack.includes(token));
      })
      .sort((a, b) => `${a.brand} ${a.model}`.localeCompare(`${b.brand} ${b.model}`));
  }, [items, brand, search, fingers]);

  useEffect(() => {
    async function fetchAll() {
      setLoading(true);
      setError("");
      try {
        const snap = await getDocs(collection(db, "huds"));
        setItems(readLegacyCatalog("huds", snap.docs.map((d) => ({ ...d.data(), id: d.id })), { transport: true }));
      } catch (e) {
        console.error(e);
        setError("Error al cargar los HUDs.");
      } finally {
        setLoading(false);
      }
    }
    fetchAll();
  }, []);

  const handleCopy = useCallback((h) => {
    if (h.integrity.conflicts.length) return;
    const text =
      `🎮 HUD ${h.brand} ${h.model} (${h.fingers})\n` +
      `━━━━━━━━━━━━━━━━\n` +
      h.steps + "\n" +
      `━━━━━━━━━━━━━━━━\n` +
      (h.notes ? `✓ ${h.notes}\n` : "") +
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
          <div className="module-title">Guía textual de HUD</div>
          <div className="module-subtitle">Instrucciones de referencia · Aplicación manual</div>
        </div>
      </div>

      <div style={{ padding: "20px 16px 80px" }}>

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
          <span style={{ color: "var(--gold)", fontWeight: 700 }}>🎮 Guía textual:</span>{" "}
          Esta base incluye instrucciones, sin imagen, código ni coordenadas reproducibles. Copiar texto no importa un HUD. Revisa alcance y comodidad antes de aplicar cambios.
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

        {/* Toggle dedos */}
        <div style={{ display: "flex", gap: "8px", marginBottom: "16px", alignItems: "center", flexWrap: "wrap" }}>
          {["Todos", ...Array.from(new Set(items.map(i => String(fingerCount(i.fingers))))).sort()].map((f) => (
            <button
              key={f}
              onClick={() => setFingers(f)}
              style={{
                padding: "6px 14px",
                borderRadius: "99px",
                border: `1px solid ${fingers === f ? "var(--gold)" : "var(--border)"}`,
                background: fingers === f ? "rgba(212,160,23,0.1)" : "var(--surface2)",
                color: fingers === f ? "var(--gold)" : "var(--text-muted)",
                fontSize: "11px",
                fontWeight: 700,
                letterSpacing: "1px",
                textTransform: "uppercase",
                transition: "all 0.2s",
              }}
            >
              {f === "Todos" ? "Todos" : `${f} Dedos`}
            </button>
          ))}
          <span className="count-tag">
            {loading ? "Cargando..." : `${filtered.length} HUD(s)`}
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
            <div style={{ fontSize: "28px", marginBottom: "12px" }}>🎮</div>
            <div className="loading-text">Cargando HUDs...</div>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 0" }}>
            <div style={{ fontSize: "28px", marginBottom: "12px" }}>📱</div>
            <div className="loading-text">No se encontró tu modelo.</div>
            <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "8px" }}>
              Prueba buscar solo la marca
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
            {filtered.map((h, i) => (
              <div key={h.id} style={{ animationDelay: `${i * 0.04}s` }}>
                <HudCard h={h} onCopy={handleCopy} />
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
            Conserva una referencia de tu HUD actual. Comprueba alcance y comodidad en el juego; modifica un control a la vez. No apliques los consejos pendientes de revisión.
          </div>
        )}
      </div>
    </div>
  );
}
