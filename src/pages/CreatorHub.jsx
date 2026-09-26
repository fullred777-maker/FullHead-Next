import { useNavigate } from "react-router-dom";
import { CREATOR, CREATOR_STYLES, MONO } from "../components/creator/creatorTokens.js";

const MODULES = [
  {
    n: 1,
    to: "/creator/oficial",
    title: "Camino Oficial",
    subtitle: "Programa de Creadores Free Fire LATAM",
    desc: "El sistema oficial de Garena que convierte tus visualizaciones en diamantes reales.",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={CREATOR.accent} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" /><path d="M20.4 14.9c-.4-.9-.4-1.9 0-2.8l.9-1.9-1.9-1.9-1.9.9c-.9.4-1.9.4-2.8 0l-1.9-.9-1.9 1.9.9 1.9c.4.9.4 1.9 0 2.8l-.9 1.9 1.9 1.9 1.9-.9c.9-.4 1.9-.4 2.8 0l1.9.9 1.9-1.9z" />
      </svg>
    ),
    tag: "Empieza aquí",
  },
  {
    n: 2,
    to: "/creator/contenido",
    title: "Contenido que Funciona",
    subtitle: "Formatos, ganchos y edición móvil",
    desc: "Por qué unos clips retienen y otros no — y cómo editar sin marca de agua, gratis.",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={CREATOR.accent} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="23 7 16 12 23 17 23 7" /><rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
      </svg>
    ),
  },
  {
    n: 3,
    to: "/creator/monetizacion",
    title: "Rutas de Monetización",
    subtitle: "Coaching, boosting, afiliación",
    desc: "Qué ruta usar según tu etapa — de tu primer dólar al primer acuerdo de marca.",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={CREATOR.accent} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </svg>
    ),
  },
  {
    n: 4,
    to: "/creator/retos",
    title: "Retos entre Amigos, Organizado",
    subtitle: "Estructura social, no apuestas reales",
    desc: "Cómo darle estructura a los retos que tu squad ya hace, sin generar conflicto.",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={CREATOR.accent} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    ageTag: "+18",
  },
  {
    n: 5,
    to: "/creator/canal",
    title: "Creando tu Canal desde Cero",
    subtitle: "Posicionamiento y primeros 90 días",
    desc: "TikTok vs. YouTube Shorts, frecuencia real y el plan día a día hasta tu primer rango oficial.",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={CREATOR.accent} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
      </svg>
    ),
  },
];

export default function CreatorHub() {
  const navigate = useNavigate();

  return (
    <div className="module-page" style={{ overflowY: "auto" }}>
      <style>{CREATOR_STYLES}</style>

      <div className="module-header">
        <button className="module-back-btn" onClick={() => navigate("/")} title="Volver">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <div>
          <div style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "2px", color: CREATOR.accent, marginBottom: "2px" }}>
            FULLHEAD CREATOR
          </div>
          <div className="module-title">Guía de Monetización</div>
          <div className="module-subtitle">Convierte tus partidas en contenido, reconocimiento e ingresos</div>
        </div>
      </div>

      <div style={{ padding: "18px 18px 60px", maxWidth: "720px", margin: "0 auto" }}>
        <div
          className="cr-fade"
          style={{
            padding: "14px 16px",
            borderRadius: "13px",
            background: `linear-gradient(135deg, ${CREATOR.accentBgStrong}, rgba(168,85,247,0.02))`,
            border: `1px solid ${CREATOR.accentBorder}`,
            marginBottom: "22px",
            fontSize: "12.5px",
            color: "#C8B8E0",
            lineHeight: 1.65,
          }}
        >
          5 módulos, en orden. Cada uno construye sobre el anterior — el Módulo 5 te lleva de la mano
          hasta el punto donde puedes aplicar al Módulo 1. No hace falta seguir el orden, pero está pensado para eso.
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {MODULES.map((m, i) => (
            <button
              key={m.n}
              onClick={() => navigate(m.to)}
              className="cr-fade cr-btn"
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "14px",
                padding: "16px",
                borderRadius: "14px",
                background: "#0C0E18",
                border: "1px solid #16192A",
                textAlign: "left",
                animationDelay: `${i * 0.05}s`,
              }}
            >
              <div style={{ width: "38px", height: "38px", borderRadius: "10px", flexShrink: 0, background: CREATOR.accentBg, border: `1px solid ${CREATOR.accentBorder}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                {m.icon}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "1px" }}>
                  <span style={{ fontFamily: MONO, fontSize: "11px", fontWeight: 700, color: "#3A4468" }}>
                    {String(m.n).padStart(2, "0")}
                  </span>
                  <div style={{ fontFamily: MONO, fontSize: "16px", fontWeight: 700, letterSpacing: "0.5px", color: "#E8DDB0" }}>
                    {m.title}
                  </div>
                  {m.tag && (
                    <span style={{ fontSize: "8.5px", fontWeight: 700, letterSpacing: "1px", textTransform: "uppercase", padding: "2px 7px", borderRadius: "20px", background: CREATOR.accentBg, color: CREATOR.accent, border: `1px solid ${CREATOR.accentBorder}` }}>
                      {m.tag}
                    </span>
                  )}
                  {m.ageTag && (
                    <span style={{ fontSize: "8.5px", fontWeight: 700, padding: "2px 7px", borderRadius: "20px", background: "rgba(229,83,83,0.1)", color: "#E58A8A", border: "1px solid rgba(229,83,83,0.3)" }}>
                      {m.ageTag}
                    </span>
                  )}
                </div>
                <div style={{ fontSize: "10.5px", color: "#5A6598", marginBottom: "5px" }}>{m.subtitle}</div>
                <div style={{ fontSize: "12px", color: "#8A93B8", lineHeight: 1.55 }}>{m.desc}</div>
              </div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3A4468" strokeWidth="2" style={{ flexShrink: 0, marginTop: "4px" }}>
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
