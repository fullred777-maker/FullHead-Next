import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CREATOR, MONO } from "./creatorTokens.js";

// ─────────────────────────────────────────────────────────
// FULLHEAD CREATOR — kit visual compartilhado
// Acento próprio (violeta), puxando do vocabulário visual de
// streaming/criadores de conteúdo (Twitch, TikTok), sem romper
// a base escura + dourada do resto do app.
// ─────────────────────────────────────────────────────────

// ── Cabeçalho de módulo (reaproveita o padrão module-header/module-page) ──
export function CreatorModuleHeader({ eyebrow, title, subtitle, backTo = "/creator" }) {
  const navigate = useNavigate();
  return (
    <div className="module-header">
      <button className="module-back-btn" onClick={() => navigate(backTo)} title="Volver">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>
      <div>
        {eyebrow && (
          <div style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "2px", color: CREATOR.accent, marginBottom: "2px" }}>
            {eyebrow}
          </div>
        )}
        <div className="module-title">{title}</div>
        {subtitle && <div className="module-subtitle">{subtitle}</div>}
      </div>
    </div>
  );
}

// ── Rótulo de seção (mesmo padrão usado no resto do app) ──
export function CreatorSectionLabel({ children }) {
  return (
    <div style={{ fontSize: "9px", fontWeight: 600, letterSpacing: "3px", color: "#3A4468", textTransform: "uppercase", display: "flex", alignItems: "center", gap: "10px", margin: "22px 0 12px" }}>
      {children}
      <span style={{ flex: 1, height: "1px", background: "#10131C" }} />
    </div>
  );
}

// ── Bloco de destaque (info, aviso, alerta) ──
const NOTE_TONES = {
  info: { bg: CREATOR.accentBg, border: CREATOR.accentBorder, title: CREATOR.accent, text: "#C8B8E0" },
  warn: { bg: "rgba(240,192,64,0.06)", border: "rgba(240,192,64,0.25)", title: "#E8C040", text: "#9A8A50" },
  danger: { bg: "rgba(229,83,83,0.06)", border: "rgba(229,83,83,0.28)", title: "#E58A8A", text: "#B08080" },
  ok: { bg: "rgba(34,201,122,0.06)", border: "rgba(34,201,122,0.25)", title: "#22C97A", text: "#7FA890" },
};

export function CreatorNote({ tone = "info", title, children }) {
  const t = NOTE_TONES[tone] || NOTE_TONES.info;
  return (
    <div style={{ padding: "13px 15px", borderRadius: "11px", background: t.bg, border: `1px solid ${t.border}`, marginBottom: "16px" }}>
      {title && <div style={{ fontSize: "11.5px", fontWeight: 700, color: t.title, marginBottom: "4px" }}>{title}</div>}
      <div style={{ fontSize: "12px", color: t.text, lineHeight: 1.65 }}>{children}</div>
    </div>
  );
}

// ── Card expansível (accordion) ──
export function ExpandableCard({ badge, badgeColor, title, summary, defaultOpen = false, accentColor, children }) {
  const [open, setOpen] = useState(defaultOpen);
  const color = accentColor || CREATOR.accent;
  return (
    <div
      className="cr-card"
      style={{
        borderRadius: "13px",
        background: open ? "rgba(168,85,247,0.04)" : "#0C0E18",
        border: `1px solid ${open ? CREATOR.accentBorder : "#16192A"}`,
        overflow: "hidden",
        marginBottom: "10px",
      }}
    >
      <button
        onClick={() => setOpen((o) => !o)}
        className="cr-btn"
        style={{ width: "100%", display: "flex", alignItems: "center", gap: "12px", padding: "14px 15px", background: "none", border: "none", textAlign: "left" }}
      >
        {badge && (
          <span style={{ fontSize: "20px", flexShrink: 0, width: "30px", textAlign: "center" }}>{badge}</span>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: MONO, fontSize: "15px", fontWeight: 700, letterSpacing: "0.5px", color: badgeColor || "#E8DDB0" }}>{title}</div>
          {summary && !open && <div style={{ fontSize: "11px", color: "#4A5578", marginTop: "2px" }}>{summary}</div>}
        </div>
        <svg
          className="cr-chevron"
          width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2"
          style={{ flexShrink: 0, transform: open ? "rotate(90deg)" : "none" }}
        >
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </button>
      {open && <div style={{ padding: "0 15px 16px" }}>{children}</div>}
    </div>
  );
}

// ── Lista de bullets com marcador consistente ──
export function BulletList({ items, color }) {
  return (
    <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "7px" }}>
      {items.map((it, i) => (
        <li key={i} style={{ display: "flex", gap: "9px", fontSize: "12.5px", color: "#8A93B8", lineHeight: 1.6 }}>
          <span style={{ color: color || CREATOR.accent, flexShrink: 0 }}>›</span>
          <span>{it}</span>
        </li>
      ))}
    </ul>
  );
}

// ── Sub-título dentro de um card (ex: "Para entrar:", "Lo que ganas:") ──
export function CardLabel({ children }) {
  return (
    <div style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "1.5px", color: "#5A6598", textTransform: "uppercase", marginBottom: "8px", marginTop: "14px" }}>
      {children}
    </div>
  );
}

// ── Lista numerada (passo a passo) ──
export function StepList({ steps }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
      {steps.map((s, i) => (
        <div key={i} style={{ display: "flex", gap: "13px", padding: "10px 0", borderBottom: i < steps.length - 1 ? "1px solid #12151F" : "none" }}>
          <div style={{ fontFamily: MONO, fontSize: "20px", fontWeight: 700, color: CREATOR.accentDim, lineHeight: 1.1, width: "24px", flexShrink: 0 }}>{i + 1}</div>
          <div style={{ fontSize: "12.5px", color: "#8A93B8", lineHeight: 1.65, paddingTop: "2px" }}>{s}</div>
        </div>
      ))}
    </div>
  );
}

// ── Tabela responsiva simples (rola no eixo X em vez de quebrar layout) ──
export function SimpleTable({ columns, rows }) {
  return (
    <div style={{ overflowX: "auto", borderRadius: "12px", border: "1px solid #16192A", marginBottom: "8px" }}>
      <table style={{ width: "100%", minWidth: "560px", borderCollapse: "collapse", fontSize: "12px" }}>
        <thead>
          <tr style={{ background: "#0C0E18" }}>
            {columns.map((c, i) => (
              <th key={i} style={{ textAlign: "left", padding: "10px 14px", fontSize: "9.5px", fontWeight: 700, letterSpacing: "1px", color: "#5A6598", textTransform: "uppercase", borderBottom: "1px solid #16192A", whiteSpace: "nowrap" }}>
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, ri) => (
            <tr key={ri} style={{ borderBottom: ri < rows.length - 1 ? "1px solid #12151F" : "none" }}>
              {r.map((cell, ci) => (
                <td key={ci} style={{ padding: "11px 14px", color: ci === 0 ? "#C8D4F0" : "#8A93B8", fontWeight: ci === 0 ? 600 : 400, verticalAlign: "top" }}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Selo pequeno (fonte, tipo de dado) ──
export function SourceTag({ children }) {
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "4px 10px", borderRadius: "20px", background: "#0C0E18", border: "1px solid #16192A", fontSize: "10px", color: "#4A5578", marginBottom: "16px" }}>
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#4A5578" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></svg>
      {children}
    </div>
  );
}
