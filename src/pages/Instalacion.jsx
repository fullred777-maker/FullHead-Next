import { Fragment, useState } from "react";
import { useNavigate } from "react-router-dom";

const RAW_STEPS = [
  {
    group: "Calibra tu celular",
    num: "01",
    title: "Sensibilidad por Celular",
    desc: "Busca tu marca y modelo para consultar una recomendación de partida. Los seis valores se conservan del catálogo original. Anota tu configuración actual antes de probar cambios.",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <circle cx="11" cy="11" r="7"/>
        <line x1="21" y1="21" x2="16.65" y2="16.65"/>
      </svg>
    ),
    tip: "Toca \"COPIAR SENSI\" para guardar una referencia de texto. Introduce los valores manualmente en los controles de sensibilidad del juego.",
  },
  {
    group: "Calibra tu celular",
    num: "05",
    title: "Perfiles del catálogo",
    desc: "El catálogo legado contiene un perfil llamado \"Geral\" por modelo. Ese nombre identifica la base original, no una certificación. Los Hz y la compatibilidad quedan desconocidos hasta confirmar una fuente.",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <circle cx="12" cy="8" r="4"/>
        <path d="M4 21v-1a8 8 0 0 1 16 0v1"/>
      </svg>
    ),
    tip: "La selección editorial es una lista de modelos elegidos para facilitar la búsqueda; no mide popularidad ni eficacia.",
  },
  {
    group: "Calibra tu celular",
    num: "02",
    title: "Guía textual de HUD",
    desc: "Consulta instrucciones textuales de referencia. La base actual solo contiene guías de 2 dedos, sin imagen, código ni coordenadas completas. Los filtros muestran únicamente la cobertura disponible.",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="2" y="6" width="20" height="12" rx="3"/>
        <circle cx="8" cy="12" r="1.6" fill="currentColor" stroke="none"/>
        <circle cx="16" cy="10" r="1.2" fill="currentColor" stroke="none"/>
        <circle cx="18" cy="14" r="1.2" fill="currentColor" stroke="none"/>
      </svg>
    ),
    tip: "Copiar la guía no importa un HUD. Revisa el alcance de tus dedos y no apliques instrucciones marcadas como pendientes por contradicciones.",
  },
  {
    group: "Calibra tu celular",
    num: "03",
    title: "Configuraciones Pro",
    desc: "Opciones de gráficos, FPS, sombras y filtros del catálogo original. Confirma si existen en tu versión del juego. No garantizan rendimiento; conserva la escala actual del sistema. Los tamaños de botones se consultan en HUD.",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/>
        <line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/>
        <line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/>
        <circle cx="4" cy="12" r="2"/><circle cx="12" cy="10" r="2"/><circle cx="20" cy="14" r="2"/>
      </svg>
    ),
    tip: "Copia una referencia, confirma cada opción y prueba un cambio a la vez. Si una opción no está disponible, conserva tu ajuste anterior.",
  },
  {
    group: "Calibra tu celular",
    num: "06",
    title: "Calibrador en Vivo",
    desc: "Complemento para crear un ajuste personalizable desde una base. La vista previa es ilustrativa y no reproduce el juego. Mirada Libre se conserva en solo lectura hasta confirmar su contrato de edición. Puedes guardar los valores en tu cuenta.",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"/>
      </svg>
    ),
    tip: "Guarda varios perfiles con nombres claros (ej: \"Rankeada\", \"AWM Sniper\") y cámbialos según el modo que estés jugando.",
  },
  {
    group: "Entrena y prepárate",
    num: "04",
    title: "Entrenamientos Diarios",
    desc: "Cuatro rutinas recomendadas: disparo a la cabeza, puntería, AWM y movimiento. Observa tus propios resultados en el juego para elegir la que mejor se adapta a ti.",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <circle cx="12" cy="13" r="8"/>
        <polyline points="12 9 12 13 15 15"/>
        <line x1="9" y1="2" x2="15" y2="2"/>
      </svg>
    ),
    tip: "Elige una rutina y conserva condiciones similares al comparar. El temporizador no comprueba que hayas practicado y puede pausarse cuando salgas al juego.",
  },
  {
    group: "Entrena y prepárate",
    num: "00",
    title: "Centro de Conexión",
    desc: "Prepara tu partida antes de abrir el juego. Tiene tres pestañas: el Medidor (estima latencia, estabilidad, pérdida de paquetes y descarga de tu red), la Guía de Optimización (un checklist de ajustes manuales para tu celular) y DNS (servidores recomendados para copiar y pegar en tus ajustes de red).",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/>
      </svg>
    ),
    tip: "Haz el test del Medidor antes de una partida importante. Si sale \"inestable\", cambia entre Wi-Fi y datos móviles y compara.",
  },
  {
    group: "Extras",
    num: "07",
    title: "Firma PRO",
    desc: "Crea tu firma estilo pro-player con más de 80 combinaciones — símbolos gamer, armas ASCII, emoticonos, fuentes especiales y tags de clan. Escribe tu nombre una vez y explora todas las categorías.",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M12 2H2v10l9.29 9.29a2.43 2.43 0 0 0 3.42 0l6.58-6.58a2.43 2.43 0 0 0 0-3.42L12 2Z"/><path d="M7 7h.01"/>
      </svg>
    ),
    tip: "Usa el botón de compartir para mandar tu firma directo por WhatsApp — buena forma de presumir tu nuevo nick.",
  },
];

// Numeración automática según el orden final
const guideSteps = RAW_STEPS.map((st, i) => ({ ...st, num: String(i + 1).padStart(2, "0") }));

const faq = [
  {
    q: "¿Tengo que descargar un APK o instalar algo raro?",
    a: "No. FullHead funciona desde tu navegador y puedes agregarlo a tu pantalla de inicio como si fuera una app, sin descargas pesadas. No modifica archivos del juego ni instala nada extra: tú aplicas los valores directamente en los ajustes oficiales de Free Fire. Lo único que te puede pedir es permiso de notificaciones, y es opcional.",
  },
  {
    q: "¿El Medidor de Conexión me dice mi ping real en Free Fire?",
    a: "No. Mide la calidad de tu red hacia un servidor de prueba (latencia, estabilidad, pérdida de paquetes y descarga) y con eso estima si tu conexión está lista. El ping exacto dentro de la partida depende de los servidores del juego. Úsalo para comparar Wi-Fi contra datos móviles y detectar problemas antes de jugar.",
  },
  {
    q: "¿Cambiar el DNS baja mi ping?",
    a: "No dentro de la partida. El DNS ayuda a que la conexión inicial (iniciar sesión, entrar a la sala) resuelva más rápido y, en algunas redes, más estable. Es un ajuste normal del sistema: si no notas mejora, vuelve a \"Automático\" cuando quieras.",
  },
  {
    q: "¿No encuentro mi modelo exacto?",
    a: "Si no encuentras tu variante, conserva tus valores actuales. Otro modelo de la misma marca no garantiza compatibilidad. Puedes comunicar tu modelo a soporte; no generamos una configuración exacta sin datos.",
  },
  {
    q: "¿Qué significa el perfil \"Geral\"?",
    a: "\"Geral\" es el nombre del único perfil legado disponible por modelo. No implica que haya sido probado ni que existan perfiles Pro adicionales.",
  },
  {
    q: "¿Cómo aplico los valores en el juego?",
    a: "Copiar solo genera texto de referencia. Abre los ajustes oficiales del juego e introduce manualmente los valores que decidas probar. FullHead no importa un HUD ni modifica archivos del juego.",
  },
  {
    q: "¿Mis datos se sincronizan entre dispositivos?",
    a: "Los ajustes que guardas en el Calibrador quedan vinculados a tu cuenta. Copiar una base no la guarda ni aplica cambios dentro de Free Fire.",
  },
  {
    q: "¿Qué es el Calibrador en Vivo?",
    a: "Es un editor complementario: seleccionas una base, ajustas los controles habilitados y guardas un perfil personal. La vista previa no valida precisión ni resultados. Mirada Libre conserva su valor original y las pruebas se realizan manualmente en el juego.",
  },
  {
    q: "¿FullHead funciona sin internet?",
    a: "Necesitas conexión para cargar los presets, HUDs, configuraciones y entrenamientos la primera vez. Una vez cargados en la sesión, la navegación entre pantallas es instantánea.",
  },
];

export default function Instalacion() {
  const navigate = useNavigate();
  const [openFaq, setOpenFaq] = useState(null);

  return (
    <div className="module-page" style={{ overflowY: "auto" }}>

      {/* Header */}
      <div className="module-header">
        <button className="module-back-btn" onClick={() => navigate("/")} title="Volver">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>
        <div>
          <div className="module-title">Cómo Usar FullHead</div>
          <div className="module-subtitle">Guía rápida de todos los módulos de FullHead</div>
        </div>
      </div>

      <div style={{ padding: "28px 28px 60px", maxWidth: "860px", margin: "0 auto" }}>

        {/* Intro banner */}
        <div style={{
          background: "linear-gradient(135deg, #141206 0%, #0D0D0D 100%)",
          border: "1px solid var(--border-gold)",
          borderRadius: "10px",
          padding: "22px 24px",
          marginBottom: "28px",
          position: "relative",
          overflow: "hidden",
        }}>
          <div style={{
            position: "absolute", top: 0, left: 0, right: 0, height: "1px",
            background: "linear-gradient(to right, transparent, var(--gold), transparent)",
          }} />
          <div style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontSize: "22px", letterSpacing: "3px",
            color: "var(--gold)", marginBottom: "8px",
          }}>
            Tus bases y ajustes de FullHead
          </div>
          <p style={{ fontSize: "13px", color: "var(--text)", lineHeight: 1.7, maxWidth: "680px" }}>
            FullHead reúne <strong style={{ color: "var(--gold)" }}>recomendaciones de sensibilidad, guías de HUD y opciones de Config Pro</strong> organizadas por dispositivo. El Calibrador es un complemento para personalizar; tú aplicas los cambios manualmente en los ajustes oficiales del juego.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginTop: "14px" }}>
            {[
              { icon: "🎯", text: "Sensibilidad por celular" },
              { icon: "🎮", text: "HUD por modelo" },
              { icon: "⚙️", text: "Opciones de gráficos" },
              { icon: "🏆", text: "Entrenamientos diarios" },
              { icon: "🎚️", text: "Calibrador personalizado" },
              { icon: "📡", text: "Centro de Conexión" },
              { icon: "✍️", text: "Firma PRO" },
            ].map((b) => (
              <div key={b.text} style={{
                display: "flex", alignItems: "center", gap: "6px",
                background: "rgba(212,160,23,0.08)",
                border: "1px solid var(--border-gold)",
                borderRadius: "6px",
                padding: "6px 12px",
                fontSize: "11px", color: "var(--text)",
                letterSpacing: "0.3px",
              }}>
                <span>{b.icon}</span>
                <span>{b.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Steps */}
        <div className="section-header-fh">
          <div className="section-label-fh">■&nbsp; Guía por módulo</div>
          <div className="section-line-fh"/>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "14px", marginBottom: "40px" }}>
          {guideSteps.map((step, idx) => (
            <Fragment key={step.num}>
            {(idx === 0 || guideSteps[idx - 1].group !== step.group) && (
              <div style={{ fontSize: "9px", fontWeight: 600, letterSpacing: "3px", color: "#3A4468", textTransform: "uppercase", display: "flex", alignItems: "center", gap: "10px", margin: idx === 0 ? "0" : "14px 0 0" }}>
                {step.group}
                <span style={{ flex: 1, height: "1px", background: "#10131C" }} />
              </div>
            )}
            <div
              className="data-card"
              style={{
                padding: "20px 22px",
                animationDelay: `${idx * 0.07}s`,
              }}
            >
              <div style={{ display: "flex", gap: "18px", alignItems: "flex-start" }}>
                {/* Step number */}
                <div style={{
                  display: "flex", flexDirection: "column", alignItems: "center",
                  gap: "6px", flexShrink: 0,
                }}>
                  <div style={{
                    fontFamily: "'Barlow Condensed', sans-serif",
                    fontSize: "28px", letterSpacing: "2px",
                    color: "var(--gold-dim)", lineHeight: 1,
                  }}>
                    {step.num}
                  </div>
                  {idx < guideSteps.length - 1 && guideSteps[idx + 1].group === step.group && (
                    <div style={{ width: "1px", height: "24px", background: "var(--border)" }} />
                  )}
                </div>

                {/* Icon + content */}
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
                    <div style={{
                      width: "44px", height: "44px",
                      borderRadius: "8px",
                      background: "rgba(212,160,23,0.08)",
                      border: "1px solid var(--border-gold)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      color: "var(--gold)", flexShrink: 0,
                    }}>
                      {step.icon}
                    </div>
                    <div style={{
                      fontFamily: "'Barlow Condensed', sans-serif",
                      fontSize: "17px", fontWeight: 700,
                      color: "var(--text)", letterSpacing: "0.5px",
                    }}>
                      {step.title}
                    </div>
                  </div>

                  <p style={{
                    fontSize: "13px", color: "var(--text)",
                    lineHeight: 1.7, marginBottom: "10px",
                  }}>
                    {step.desc}
                  </p>

                  {step.tip && (
                    <div style={{
                      display: "flex", alignItems: "flex-start", gap: "8px",
                      padding: "8px 12px",
                      background: "rgba(212,160,23,0.04)",
                      border: "1px solid rgba(212,160,23,0.2)",
                      borderRadius: "6px",
                      fontSize: "11px", color: "var(--text-muted)",
                      lineHeight: 1.5,
                    }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--gold-dim)" strokeWidth="2" style={{ flexShrink: 0, marginTop: "1px" }}>
                        <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                      </svg>
                      <span><strong style={{ color: "var(--gold-dim)" }}>Consejo:</strong> {step.tip}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            </Fragment>
          ))}
        </div>

        {/* Success banner */}
        <div style={{
          background: "rgba(30,140,74,0.08)",
          border: "1px solid rgba(30,140,74,0.35)",
          borderRadius: "10px",
          padding: "18px 22px",
          marginBottom: "40px",
          display: "flex", gap: "14px", alignItems: "center",
        }}>
          <div style={{
            width: "40px", height: "40px",
            borderRadius: "50%",
            background: "rgba(30,140,74,0.15)",
            border: "1px solid rgba(30,140,74,0.4)",
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1E8C4A" strokeWidth="2.5">
              <path d="M20 6L9 17l-5-5"/>
            </svg>
          </div>
          <div>
            <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "15px", fontWeight: 700, color: "#1E8C4A", marginBottom: "4px" }}>
              ¡Ya conoces todo el sistema!
            </div>
            <div style={{ fontSize: "12px", color: "var(--text-muted)", lineHeight: 1.6 }}>
              Empieza por revisar tu sensibilidad, HUD y gráficos actuales. Conserva una referencia antes de cambiar algo y compara un ajuste a la vez. Una base recomendada no garantiza mejoras en tus partidas.
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div className="section-header-fh">
          <div className="section-label-fh">■&nbsp; Preguntas frecuentes</div>
          <div className="section-line-fh"/>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {faq.map((item, idx) => (
            <div
              key={idx}
              className="data-card"
              style={{
                padding: "0",
                cursor: "pointer",
                transition: "border-color 0.2s",
              }}
              onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
            >
              <div style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "14px 18px", gap: "12px",
              }}>
                <div style={{
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontSize: "14px", fontWeight: 700,
                  color: "var(--text)", letterSpacing: "0.3px",
                }}>
                  {item.q}
                </div>
                <div style={{
                  color: "var(--gold-dim)",
                  transition: "transform 0.2s",
                  transform: openFaq === idx ? "rotate(45deg)" : "rotate(0deg)",
                  flexShrink: 0,
                }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="12" y1="5" x2="12" y2="19"/>
                    <line x1="5" y1="12" x2="19" y2="12"/>
                  </svg>
                </div>
              </div>
              {openFaq === idx && (
                <div style={{
                  padding: "0 18px 14px",
                  fontSize: "13px", color: "var(--text-muted)",
                  lineHeight: 1.7,
                  borderTop: "1px solid var(--border)",
                  paddingTop: "12px",
                }}>
                  {item.a}
                </div>
              )}
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
