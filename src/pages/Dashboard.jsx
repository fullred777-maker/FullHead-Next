import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db, auth, messaging } from "../firebase";
import { inicializarNotificaciones } from "../utils/notifications.js";

const UPDATE_NOTICE_KEY = "fh_update_seen_v4_conexion";

const modules = [
  {
    title: "Sensibilidad por Celular",
    desc: "Presets PRO por modelo de dispositivo.",
    route: "/sensi",
    accent: "#3B82F6",
    badge: { text: "PRO", bg: "rgba(212,170,0,0.1)", color: "#D4AA00", border: "rgba(212,170,0,0.2)" },
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/>
        <line x1="4.93" y1="4.93" x2="9.17" y2="9.17"/><line x1="14.83" y1="14.83" x2="19.07" y2="19.07"/>
        <line x1="14.83" y1="9.17" x2="19.07" y2="4.93"/><line x1="4.93" y1="19.07" x2="9.17" y2="14.83"/>
      </svg>
    ),
  },
  {
    title: "HUD Pro",
    desc: "Interfaces recomendadas para mejor visibilidad.",
    route: "/hud",
    accent: "#F97316",
    badge: { text: "PRO", bg: "rgba(212,170,0,0.1)", color: "#D4AA00", border: "rgba(212,170,0,0.2)" },
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="#F97316" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
      </svg>
    ),
  },
  {
    title: "Configuraciones Pro",
    desc: "Ajustes avanzados para optimizar tu juego.",
    route: "/configs",
    accent: "#06B6D4",
    badge: { text: "PRO", bg: "rgba(212,170,0,0.1)", color: "#D4AA00", border: "rgba(212,170,0,0.2)" },
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="#06B6D4" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/>
      </svg>
    ),
  },
  {
    title: "Entrenamientos Diarios",
    desc: "Rutinas rápidas para mejorar tu destreza.",
    route: "/treinos",
    accent: "#10B981",
    badge: null,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
      </svg>
    ),
  },
  {
    title: "Calibrador en Vivo",
    desc: "Ajusta, prueba y guarda tu sensibilidad personalizada.",
    route: "/calibrador",
    accent: "#D4AA00",
    badge: null,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="#D4AA00" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"/>
      </svg>
    ),
  },
  {
    title: "Centro de Conexión",
    desc: "Mide tu red, sigue la guía de optimización y configura un DNS estable.",
    route: "/conexion",
    accent: "#38BDF8",
    badge: { text: "NUEVO", bg: "rgba(16,185,129,0.12)", color: "#22C97A", border: "rgba(16,185,129,0.2)" },
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="#38BDF8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/>
      </svg>
    ),
  },
  {
    title: "FullHead Creator · convierte tus partidas en ingresos",
    desc: "Guía completa para monetizar tu contenido de Free Fire, paso a paso.",
    route: "/creator",
    accent: "#A855F7",
    badge: { text: "EXCLUSIVO", bg: "rgba(168,85,247,0.12)", color: "#A855F7", border: "rgba(168,85,247,0.3)" },
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="#A855F7" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/><path d="M20.4 14.9c-.4-.9-.4-1.9 0-2.8l.9-1.9-1.9-1.9-1.9.9c-.9.4-1.9.4-2.8 0l-1.9-.9-1.9 1.9.9 1.9c.4.9.4 1.9 0 2.8l-.9 1.9 1.9 1.9 1.9-.9c.9-.4 1.9-.4 2.8 0l1.9.9 1.9-1.9z"/>
      </svg>
    ),
  },
  {
    title: "Firma PRO · genera tu nick con estilo",
    desc: "Crea tu firma estilo pro-player con símbolos y fuentes especiales.",
    route: "/nicks",
    accent: "#E67E22",
    badge: { text: "NUEVO", bg: "rgba(230,126,34,0.12)", color: "#E67E22", border: "rgba(230,126,34,0.25)" },
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="#E67E22" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 7V4a1 1 0 0 1 1-1h3M20 7V4a1 1 0 0 0-1-1h-3M4 17v3a1 1 0 0 0 1 1h3M20 17v3a1 1 0 0 1-1 1h-3"/>
      </svg>
    ),
  },
];

const MODULE_GROUPS = [
  { title: "Calibra tu celular", routes: ["/sensi", "/hud", "/configs", "/calibrador"] },
  { title: "Entrena y prepárate", routes: ["/treinos", "/conexion"] },
  { title: "Extras", routes: ["/nicks"], fullWidth: true },
  { title: "FullHead Creator", routes: ["/creator"], fullWidth: true },
];

function hexToRgba(hex, alpha) {
  const h = hex.replace("#", "");
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function ModCard({ mod, idx, fullWidth }) {
  const accent = mod.accent;
  const iconBg = hexToRgba(accent, 0.10);
  const iconBorder = hexToRgba(accent, 0.15);
  const btnBg = hexToRgba(accent, 0.08);
  const btnBorder = hexToRgba(accent, 0.18);
  const btnColor = accent === "#3B82F6" ? "#4A8FFF" : accent === "#10B981" ? "#22C97A" : accent;

  return (
    <Link
      to={mod.route}
      className={fullWidth ? "card-enter prem-card-fh" : "card-enter"}
      style={{
        background: "#0C0E18",
        border: "1px solid #16192A",
        borderRadius: "13px",
        padding: "14px",
        position: "relative",
        overflow: "hidden",
        textDecoration: "none",
        display: "block",
        animationDelay: `${idx * 0.05 + 0.05}s`,
        transition: "transform 0.2s, border-color 0.2s, box-shadow 0.2s",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-2px)";
        e.currentTarget.style.borderColor = hexToRgba(accent, 0.3);
        e.currentTarget.style.boxShadow = `0 8px 24px rgba(0,0,0,0.5), 0 0 0 1px ${hexToRgba(accent, 0.1)}`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.borderColor = "#16192A";
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      {/* Accent bar top */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "2px", background: accent, borderRadius: "13px 13px 0 0" }} />

      {/* Numero ou Badge */}
      {mod.badge ? (
        <div style={{ position: "absolute", top: "10px", right: "12px", fontSize: "8px", fontWeight: 700, letterSpacing: "1px", padding: "2px 7px", borderRadius: "3px", background: mod.badge.bg, color: mod.badge.color, border: `1px solid ${mod.badge.border}` }}>
          {mod.badge.text}
        </div>
      ) : mod.num ? (
        <div style={{ position: "absolute", top: "10px", right: "12px", fontFamily: "'Barlow Condensed', sans-serif", fontSize: "28px", fontWeight: 700, color: "#fff", opacity: 0.04, letterSpacing: "1px", lineHeight: 1, pointerEvents: "none" }}>
          {mod.num}
        </div>
      ) : null}

      {/* Icon */}
      <div style={{ width: "32px", height: "32px", borderRadius: "9px", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "12px", background: iconBg, border: `1px solid ${iconBorder}` }}>
        <div style={{ width: "15px", height: "15px" }}>{mod.icon}</div>
      </div>

      {/* Title */}
      <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "14px", fontWeight: 700, letterSpacing: "1.5px", color: "#C8D4F0", textTransform: "uppercase", lineHeight: 1.2, marginBottom: "5px" }}>
        {mod.title}
      </div>

      {/* Desc */}
      <div style={{ fontSize: "11px", color: "#4A5578", lineHeight: 1.4, marginBottom: "13px" }}>
        {mod.desc}
      </div>

      {/* Button */}
      <div style={{ width: "100%", padding: "7px 10px", borderRadius: "7px", background: btnBg, color: btnColor, border: `1px solid ${btnBorder}`, fontSize: "10px", fontWeight: 700, letterSpacing: "1.5px", textTransform: "uppercase", display: "flex", alignItems: "center", justifyContent: "space-between", fontFamily: "'Inter', sans-serif" }}>
        Acceder <span>›</span>
      </div>
    </Link>
  );
}

export default function Dashboard() {
  const [showUpdate, setShowUpdate] = useState(false);
  const [deviceCount, setDeviceCount] = useState(null);
  const [notifStatus, setNotifStatus] = useState("default");
  const [notifLoading, setNotifLoading] = useState(false);

  useEffect(() => {
    setShowUpdate(!localStorage.getItem(UPDATE_NOTICE_KEY));
    getDocs(collection(db, "presets"))
      .then((snap) => setDeviceCount(snap.size))
      .catch(() => setDeviceCount(null));
    if (typeof Notification !== "undefined") {
      setNotifStatus(Notification.permission);
    }
  }, []);

  const dismissUpdate = () => {
    localStorage.setItem(UPDATE_NOTICE_KEY, "true");
    setShowUpdate(false);
  };

  const activarNotificaciones = async () => {
    // Chamado direto de um clique — isso conta como gesto real do usuário,
    // então o navegador não bloqueia o pedido de permissão.
    setNotifLoading(true);
    try {
      const user = auth.currentUser;
      if (user) await inicializarNotificaciones(user.uid, messaging);
    } finally {
      setNotifLoading(false);
      if (typeof Notification !== "undefined") setNotifStatus(Notification.permission);
    }
  };

  return (
    <div style={{ background: "var(--black)", minHeight: "100vh", color: "var(--text)", fontFamily: "'Inter', sans-serif" }}>

      {/* CONTEÚDO */}
      <div style={{ padding: "20px 18px", display: "flex", flexDirection: "column", gap: "18px", maxWidth: "1100px", margin: "0 auto" }}>

        {/* AVISO DE ACTUALIZACIÓN */}
        {showUpdate && (
          <div style={{
            padding: "14px 16px", borderRadius: "12px",
            background: "linear-gradient(135deg, rgba(212,170,0,0.08), rgba(12,14,24,0.4))",
            border: "1px solid rgba(212,170,0,0.25)",
            display: "flex", alignItems: "flex-start", gap: "12px",
            position: "relative", animation: "cardIn 0.3s ease both",
          }}>
            <div style={{
              width: "34px", height: "34px", borderRadius: "9px", flexShrink: 0,
              background: "rgba(212,170,0,0.12)", border: "1px solid rgba(212,170,0,0.3)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#D4AA00" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12a9 9 0 1 1-3.5-7.1M21 3v6h-6"/>
              </svg>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "13px", fontWeight: 700, letterSpacing: "1.5px", color: "#E8DDB0", textTransform: "uppercase", marginBottom: "4px" }}>
                ¡Nueva actualización!
              </div>
              <div style={{ fontSize: "11.5px", color: "#8A93B8", lineHeight: 1.6 }}>
                Llegó el <strong style={{ color: "#C8D4F0" }}>Centro de Conexión</strong>: mide la calidad de tu red antes de jugar, sigue la guía de optimización y configura un DNS estable. Todo desde tu navegador, sin instalar nada. Seguimos trabajando — pronto llegan más novedades.
              </div>
            </div>
            <button
              onClick={dismissUpdate}
              title="Cerrar aviso"
              style={{
                background: "none", border: "none", color: "#4A5578", cursor: "pointer",
                padding: "2px", flexShrink: 0, lineHeight: 0,
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
        )}

        {/* BONO EXCLUSIVO — RADAR SONORO */}
        <Link
          to="/treinos?cat=Radar%20Sonoro"
          style={{
            display: "flex", alignItems: "center", gap: "12px",
            padding: "14px 16px", borderRadius: "12px", textDecoration: "none",
            background: "linear-gradient(135deg, rgba(240,192,64,0.1), rgba(10,10,10,0.3))",
            border: "1px solid rgba(240,192,64,0.3)",
            animation: "cardIn 0.3s ease both",
          }}
        >
          <div style={{
            width: "38px", height: "38px", borderRadius: "10px", flexShrink: 0,
            background: "rgba(240,192,64,0.14)", border: "1px solid rgba(240,192,64,0.35)",
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px",
          }}>🎧</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "7px", marginBottom: "2px" }}>
              <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "13px", fontWeight: 700, letterSpacing: "1px", color: "#F0C040", textTransform: "uppercase" }}>
                Radar Sonoro
              </span>
              <span style={{ fontSize: "7px", fontWeight: 800, letterSpacing: "0.5px", padding: "2px 6px", borderRadius: "99px", background: "rgba(240,192,64,0.2)", color: "#F0C040" }}>BONO EXCLUSIVO</span>
            </div>
            <div style={{ fontSize: "11px", color: "#8A93B8" }}>
              Entrena tu oído para detectar enemigos por dirección de sonido.
            </div>
          </div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#F0C040" strokeWidth="2" style={{ flexShrink: 0 }}>
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </Link>

        {/* ACTIVAR NOTIFICACIONES */}
        {notifStatus === "default" && (
          <div style={{
            padding: "14px 16px", borderRadius: "12px",
            background: "rgba(255,255,255,0.02)",
            border: "1px solid rgba(255,255,255,0.08)",
            display: "flex", alignItems: "center", gap: "12px",
            flexWrap: "wrap", animation: "cardIn 0.3s ease both",
          }}>
            <div style={{
              width: "34px", height: "34px", borderRadius: "9px", flexShrink: 0,
              background: "rgba(74,143,255,0.1)", border: "1px solid rgba(74,143,255,0.25)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#4A8FFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
            </div>
            <div style={{ flex: 1, minWidth: "180px" }}>
              <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "13px", fontWeight: 700, letterSpacing: "1px", color: "#C8D4F0" }}>
                Activa las notificaciones
              </div>
              <div style={{ fontSize: "11px", color: "#4A5578" }}>
                Entérate cuando haya novedades en FullHead.
              </div>
            </div>
            <button
              onClick={activarNotificaciones}
              disabled={notifLoading}
              style={{
                padding: "9px 16px", borderRadius: "8px",
                background: "rgba(74,143,255,0.1)", border: "1px solid rgba(74,143,255,0.3)",
                color: "#4A8FFF", fontSize: "11px", fontWeight: 700, letterSpacing: "1px",
                cursor: notifLoading ? "not-allowed" : "pointer", textTransform: "uppercase",
                flexShrink: 0,
              }}
            >
              {notifLoading ? "Activando..." : "Activar"}
            </button>
          </div>
        )}


        {/* HERO */}
        <section style={{ padding: "18px 20px", borderRadius: "16px", background: "#0C0E18", border: "1px solid #16192A", position: "relative", overflow: "hidden" }}>
          {/* Corner art */}
          <svg style={{ position: "absolute", top: 0, right: 0, width: "110px", height: "110px", pointerEvents: "none" }} viewBox="0 0 110 110" fill="none" xmlns="http://www.w3.org/2000/svg">
            <line x1="110" y1="0" x2="50" y2="0" stroke="#D4AA00" strokeWidth="0.5" opacity="0.18" />
            <line x1="110" y1="0" x2="110" y2="60" stroke="#D4AA00" strokeWidth="0.5" opacity="0.18" />
            <line x1="110" y1="20" x2="80" y2="0" stroke="#D4AA00" strokeWidth="0.3" opacity="0.1" />
            <line x1="110" y1="40" x2="100" y2="0" stroke="#D4AA00" strokeWidth="0.3" opacity="0.1" />
            <circle cx="110" cy="0" r="45" stroke="#D4AA00" strokeWidth="0.4" opacity="0.06" fill="none" />
            <circle cx="110" cy="0" r="75" stroke="#D4AA00" strokeWidth="0.3" opacity="0.04" fill="none" />
          </svg>

          <div style={{ fontSize: "9px", fontWeight: 600, letterSpacing: "4px", color: "#D4AA00", opacity: 0.7, textTransform: "uppercase", marginBottom: "8px" }}>
            MÓDULOS DISPONIBLES
          </div>
          <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "28px", fontWeight: 700, letterSpacing: "2px", color: "#E8DDB0", lineHeight: 1, marginBottom: "5px", textTransform: "uppercase" }}>
            SISTEMA <span style={{ color: "#D4AA00" }}>FULLHEAD</span>
          </div>
          <div style={{ fontSize: "12px", color: "#4A5578", marginBottom: "14px" }}>
            Selecciona un módulo para optimizar tu rendimiento al máximo
          </div>

          {/* Stats */}
          <div style={{ display: "flex", gap: "14px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
              <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "18px", fontWeight: 700, color: "#D4AA00", letterSpacing: "1px", lineHeight: 1 }}>{modules.length}</div>
              <div style={{ fontSize: "9px", color: "#3A4060", letterSpacing: "2px", textTransform: "uppercase" }}>Módulos</div>
            </div>
            <div style={{ width: "1px", background: "#16192A", alignSelf: "stretch" }} />
            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
              <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "18px", fontWeight: 700, color: "#D4AA00", letterSpacing: "1px", lineHeight: 1 }}>7D</div>
              <div style={{ fontSize: "9px", color: "#3A4060", letterSpacing: "2px", textTransform: "uppercase" }}>Actualización</div>
            </div>
            <div style={{ width: "1px", background: "#16192A", alignSelf: "stretch" }} />
            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
              <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "18px", fontWeight: 700, color: "#D4AA00", letterSpacing: "1px", lineHeight: 1 }}>{deviceCount ?? "…"}</div>
              <div style={{ fontSize: "9px", color: "#3A4060", letterSpacing: "2px", textTransform: "uppercase" }}>Dispositivos</div>
            </div>
          </div>
        </section>

        {/* GUÍA RÁPIDA */}
        <Link
          to="/instalacion"
          style={{
            display: "flex", alignItems: "center", gap: "12px",
            padding: "12px 14px", borderRadius: "12px", textDecoration: "none",
            background: "#0C0E18", border: "1px solid #16192A",
          }}
        >
          <div style={{ width: "32px", height: "32px", borderRadius: "9px", flexShrink: 0, background: "rgba(212,170,0,0.1)", border: "1px solid rgba(212,170,0,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#D4AA00" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "13px", fontWeight: 700, letterSpacing: "1.5px", color: "#C8D4F0", textTransform: "uppercase" }}>
              ¿Primera vez? Mira la guía rápida
            </div>
            <div style={{ fontSize: "11px", color: "#4A5578" }}>Cómo usar cada módulo, paso a paso.</div>
          </div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#D4AA00" strokeWidth="2" style={{ flexShrink: 0 }}>
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </Link>

        {/* MÓDULOS AGRUPADOS */}
        {(() => {
          let n = 0;
          return MODULE_GROUPS.map((g) => {
            const mods = g.routes.map((r) => modules.find((m) => m.route === r)).filter(Boolean);
            return (
              <div key={g.title} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <div style={{ fontSize: "9px", fontWeight: 600, letterSpacing: "4px", color: "#2A3050", textTransform: "uppercase", display: "flex", alignItems: "center", gap: "10px" }}>
                  {g.title}
                  <span style={{ flex: 1, height: "1px", background: "#10131C" }} />
                </div>
                <div className="mods-grid-fh">
                  {mods.map((mod) => (
                    <ModCard key={mod.title} mod={mod} idx={n++} fullWidth={g.fullWidth} />
                  ))}
                </div>
              </div>
            );
          });
        })()}

        {/* TIP BAR */}
        <div style={{ padding: "10px 14px", borderRadius: "10px", background: "#0C0E18", border: "1px solid #10131C", display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ width: "2px", height: "26px", background: "#D4AA00", opacity: 0.25, borderRadius: "2px", flexShrink: 0 }} />
          <div style={{ fontSize: "11px", color: "#4A5578", lineHeight: 1.5 }}>
            <strong style={{ color: "#6A78A8", fontWeight: 600 }}>Consejo Pro:</strong>{" "}
            Todos los ajustes se sincronizan automáticamente en tu cuenta. Accede desde cualquier dispositivo.
          </div>
        </div>
      </div>

      <style>{`
        .mods-grid-fh {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 10px;
        }
        .mods-grid-fh .prem-card-fh {
          grid-column: 1 / -1;
        }
        @media (min-width: 720px) {
          .mods-grid-fh { grid-template-columns: repeat(3, 1fr); gap: 12px; }
        }
      `}</style>
    </div>
  );
}
