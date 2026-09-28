import { useEffect, useMemo, useState, useCallback } from "react";
import { collection, getDocs } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { db } from "../firebase";
import { readLegacyCatalog } from "../domain/legacyCatalog.js";
import { CatalogNotice, CopyFallback } from "../components/CatalogNotice.jsx";
import { useClipboard } from "../hooks/useClipboard.js";
import { SENSITIVITY_FIELDS } from "../domain/configContracts.js";
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
      background: "#D4AA00",
      color: "#07080C",
      fontFamily: "'Barlow Condensed', sans-serif",
      fontWeight: 700,
      fontSize: "13px",
      letterSpacing: "2px",
      padding: "10px 24px",
      borderRadius: "99px",
      boxShadow: "0 8px 32px rgba(212,170,0,0.35)",
      zIndex: 999,
      pointerEvents: "none",
      whiteSpace: "nowrap",
    }}>
      ✓ SENSI COPIADA
    </div>
  );
}

// ── BARRA DE PROGRESSO COLORIDA ────────────────────────
const STAT_COLORS = {
  general: "#D4AA00",   // gold
  redDot:  "#E55353",   // red
  x2:      "#3B82F6",   // blue
  x4:      "#F0B400",   // yellow
  awm:     "#06B6D4",   // cyan
  freeLook:"#10B981",   // green
};

export function StatBar({ label, value, max, color }) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
      <div style={{ fontSize: "9px", letterSpacing: "1px", color: "#6A78A8", textTransform: "uppercase", fontWeight: 600, width: "85px", flexShrink: 0 }}>
        {label}
      </div>
      <div style={{ flex: 1, height: "5px", background: "#0D1018", borderRadius: "3px", overflow: "hidden", position: "relative" }}>
        <div style={{
          height: "100%",
          width: `${pct}%`,
          background: color,
          borderRadius: "3px",
          transition: "width 0.6s ease",
          boxShadow: `0 0 6px ${color}55`,
        }} />
      </div>
      <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "13px", fontWeight: 700, color: "#C8D4F0", minWidth: "26px", textAlign: "right", letterSpacing: "0.5px" }}>
        {value}
      </div>
    </div>
  );
}

// ── BADGE DE GAMA ──────────────────────────────────────

// ── CARD DE PRESET ─────────────────────────────────────
export function PresetCard({ p, onCopy, isPopular, idx }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className="card-enter"
      style={{
        background: "#0C0E18",
        border: "1px solid #16192A",
        borderRadius: "13px",
        padding: "14px",
        position: "relative",
        overflow: "hidden",
        transition: "border-color 0.2s, box-shadow 0.2s",
        animationDelay: `${idx * 0.04}s`,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "rgba(212,170,0,0.3)";
        e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.5)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "#16192A";
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      {/* Linha dourada top em populares */}
      {isPopular && (
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, height: "2px",
          background: "linear-gradient(90deg, transparent, #D4AA00, transparent)",
        }} />
      )}

      {/* Header: nome + DPI */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "10px", marginBottom: "12px" }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontSize: "16px",
            fontWeight: 700,
            color: "#E8DDB0",
            letterSpacing: "1.2px",
            textTransform: "uppercase",
            lineHeight: 1.2,
            marginBottom: "6px",
          }}>
            {p.brand} {p.model}
          </div>
          <div style={{ display: "flex", gap: "5px", flexWrap: "wrap", alignItems: "center" }}>

            {isPopular && (
              <span style={{
                display: "inline-block",
                background: "rgba(229,83,83,0.1)",
                border: "1px solid rgba(229,83,83,0.25)",
                color: "#E55353",
                fontSize: "8px",
                fontWeight: 700,
                letterSpacing: "1.5px",
                padding: "2px 7px",
                borderRadius: "4px",
                textTransform: "uppercase",
              }}>
                Selección editorial
              </span>
            )}
          </div>
        </div>

        {/* DPI block */}
        <div style={{ textAlign: "right", flexShrink: 0, padding: "4px 10px", borderRadius: "8px", background: "rgba(212,170,0,0.06)", border: "1px solid rgba(212,170,0,0.18)" }}>
          <div style={{ fontSize: "8px", color: "#8A6E00", letterSpacing: "2px", textTransform: "uppercase", fontWeight: 600 }}>DPI legado · no requerido</div>
          <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "20px", fontWeight: 700, color: "#D4AA00", lineHeight: 1, letterSpacing: "0.5px" }}>
            {p.integrity.dpi.status === "not_applicable" ? "No aplica" : p.dpi}
          </div>
        </div>
      </div>

      {/* Stat bars */}
      <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "12px", padding: "10px 12px", background: "#080A10", borderRadius: "8px", border: "1px solid #10131C" }}>
        {SENSITIVITY_FIELDS.map(field => <StatBar key={field.key} label={field.label} value={p[field.key]} max={field.max} color={STAT_COLORS[field.key]} />)}
      </div>

      <CatalogNotice record={p} />
      {/* Note */}
      {p.notes && (
        <div
          onClick={() => setExpanded(!expanded)}
          style={{
            marginBottom: "12px",
            padding: "8px 10px",
            background: "#080A10",
            border: "1px solid #10131C",
            borderRadius: "7px",
            fontSize: "10px",
            color: "#4A5578",
            lineHeight: 1.5,
            cursor: "pointer",
            display: "flex",
            alignItems: "flex-start",
            gap: "6px",
          }}
        >
          <span style={{ color: "#8A6E00", flexShrink: 0, marginTop: "1px", fontWeight: 700 }}>ℹ</span>
          <span style={{ flex: 1 }}>
            Archivo original sin revisar: {expanded ? p.notes : p.notes.slice(0, 60) + (p.notes.length > 60 ? "..." : "")}
          </span>
          {p.notes.length > 60 && (
            <span style={{ color: "#8A6E00", fontSize: "10px", flexShrink: 0 }}>
              {expanded ? "▲" : "▼"}
            </span>
          )}
        </div>
      )}

      {/* Copy button */}
      <button
        onClick={() => onCopy(p)}
        style={{
          width: "100%",
          padding: "9px",
          background: "rgba(212,170,0,0.08)",
          border: "1px solid rgba(212,170,0,0.20)",
          borderRadius: "8px",
          color: "#D4AA00",
          fontFamily: "'Barlow Condensed', sans-serif",
          fontSize: "12px",
          fontWeight: 700,
          letterSpacing: "2.5px",
          textTransform: "uppercase",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "8px",
          transition: "all 0.2s",
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(212,170,0,0.14)"; e.currentTarget.style.borderColor = "rgba(212,170,0,0.32)"; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(212,170,0,0.08)"; e.currentTarget.style.borderColor = "rgba(212,170,0,0.20)"; }}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
        </svg>
        COPIAR SENSI
      </button>
    </div>
  );
}

// ── COMPONENTE PRINCIPAL ───────────────────────────────
const EDITORIAL_MODELS = [
  "Samsung A06", "Samsung A15", "Samsung A16", "Samsung A56",
  "Xiaomi Redmi Note 12", "Xiaomi Redmi Note 13", "Xiaomi Redmi 14C",
  "Motorola Moto G15", "Motorola Moto G54",
  "Infinix Hot 50 Pro", "Tecno Spark 20",
];

export default function Sensi() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [brand, setBrand] = useState("Todos");
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const { toast, manualText, copy, closeManual } = useClipboard();
  const [onlyPopular, setOnlyPopular] = useState(false);

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
        const haystack = `${i.brand} ${i.model} ${i.profile}`.toLowerCase();
        return s.split(/\s+/).every((token) => haystack.includes(token));
      })
      .filter((i) => {
        if (!onlyPopular) return true;
        return EDITORIAL_MODELS.includes(`${i.brand} ${i.model}`);
      })
      .sort((a, b) => `${a.brand} ${a.model}`.localeCompare(`${b.brand} ${b.model}`));
  }, [items, brand, search, onlyPopular]);

  const isPopular = (p) => EDITORIAL_MODELS.includes(`${p.brand} ${p.model}`);

  async function fetchAll() {
    setLoading(true);
    setError("");
    try {
      const snap = await getDocs(collection(db, "presets"));
      setItems(readLegacyCatalog("presets", snap.docs.map((d) => ({ ...d.data(), id: d.id })), { transport: true }));
    } catch (e) {
      console.error(e);
      setError("Error al cargar los presets del servidor.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchAll(); }, []);

  const handleCopy = useCallback((p) => {
    const text =
      `📱 ${p.brand} ${p.model}\n` +
      `━━━━━━━━━━━━━━━━\n` +
      `General:      ${p.general}\n` +
      `Red Dot:      ${p.redDot}\n` +
      `Mira 2x:      ${p.x2}\n` +
      `Mira 4x:      ${p.x4}\n` +
      `AWM:          ${p.awm}\n` +
      `Mirada Libre: ${p.freeLook}\n` +
      `DPI:          ${p.integrity.dpi.status === "not_applicable" ? "No aplica" : p.dpi} (dato legado; no cambies la escala del sistema)\n` +
      `━━━━━━━━━━━━━━━━\n` +
      `Recomendación FullHead. Aplicación manual. Conserva tu configuración anterior.\nFullHead ⚡`;
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
          <div className="module-title">Sensibilidad por Celular</div>
          <div className="module-subtitle">Base recomendada · Ajuste personalizable</div>
        </div>
      </div>

      <div style={{ padding: "20px 16px 80px", maxWidth: "1100px", margin: "0 auto" }}>

        <ProfileActive />

        {/* Info banner */}
        <div style={{
          background: "rgba(212,170,0,0.05)",
          border: "1px solid rgba(212,170,0,0.18)",
          borderRadius: "10px",
          padding: "11px 14px",
          marginBottom: "16px",
          fontSize: "11px",
          color: "#4A5578",
          lineHeight: 1.6,
          display: "flex",
          alignItems: "flex-start",
          gap: "8px",
        }}>
          <span style={{ color: "#D4AA00", fontWeight: 700, flexShrink: 0 }}>⚡ Método FullHead:</span>
          <span>Busca tu modelo y revisa una recomendación de partida. Copiar guarda texto; debes introducir los valores manualmente en el juego.</span>
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

        {/* Toggle popular */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px", flexWrap: "wrap" }}>
          <button
            onClick={() => setOnlyPopular(!onlyPopular)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "6px 14px",
              borderRadius: "99px",
              border: `1px solid ${onlyPopular ? "rgba(212,170,0,0.4)" : "#16192A"}`,
              background: onlyPopular ? "rgba(212,170,0,0.08)" : "#0C0E18",
              color: onlyPopular ? "#D4AA00" : "#4A5578",
              fontFamily: "'Inter', sans-serif",
              fontSize: "10px",
              fontWeight: 700,
              letterSpacing: "1.5px",
              textTransform: "uppercase",
              transition: "all 0.2s",
            }}
          >
            Selección editorial
          </button>
          <span className="count-tag">
            {loading ? "Cargando..." : `${filtered.length} modelo(s)`}
          </span>
        </div>

        {/* Erro */}
        {error && (
          <div style={{
            marginBottom: "16px",
            padding: "12px 16px",
            background: "rgba(229,83,83,0.08)",
            border: "1px solid rgba(229,83,83,0.25)",
            borderRadius: "8px",
            fontSize: "12px",
            color: "#E55353",
          }}>
            {error}
          </div>
        )}

        {/* Lista */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "60px 0" }}>
            <div style={{ fontSize: "28px", marginBottom: "12px" }}>⚡</div>
            <div className="loading-text">Cargando presets...</div>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 0" }}>
            <div style={{ fontSize: "28px", marginBottom: "12px" }}>📱</div>
            <div className="loading-text">No se encontró tu modelo.</div>
            <div style={{ fontSize: "11px", color: "#4A5578", marginTop: "8px" }}>
              Escribe tu marca + modelo exacto
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
            gridTemplateColumns: "repeat(auto-fill, minmax(290px, 1fr))",
            gap: "12px",
          }}>
            {filtered.map((p, i) => (
              <PresetCard key={p.id} p={p} onCopy={handleCopy} isPopular={isPopular(p)} idx={i} />
            ))}
          </div>
        )}

        {/* Dica final */}
        {!loading && filtered.length > 0 && (
          <div style={{
            marginTop: "28px",
            padding: "12px 14px",
            background: "#0C0E18",
            border: "1px solid #10131C",
            borderRadius: "10px",
            fontSize: "11px",
            color: "#4A5578",
            lineHeight: 1.6,
            display: "flex",
            alignItems: "flex-start",
            gap: "10px",
          }}>
            <div style={{ width: "2px", alignSelf: "stretch", background: "#D4AA00", opacity: 0.3, borderRadius: "2px", flexShrink: 0 }} />
            <div>
              <strong style={{ color: "#6A78A8", fontWeight: 600 }}>Pro tip:</strong>{" "}
              Guarda tus valores actuales antes de probar una base. Cambia un control a la vez y compara en el juego. Si no encuentras tu variante, no asumas que otro modelo es equivalente.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
