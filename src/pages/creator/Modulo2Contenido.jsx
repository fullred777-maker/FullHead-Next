import { CREATOR, CREATOR_STYLES, MONO } from "../../components/creator/creatorTokens.js";
import {
  CreatorModuleHeader, CreatorSectionLabel, CreatorNote, BulletList, SourceTag,
} from "../../components/creator/CreatorUI.jsx";

const OPENINGS = [
  { n: 1, title: "Apertura con apuesta ya en juego", desc: "El clip abre con la situación de riesgo ya establecida (ej. último de la squad vivo, zona cerrando), no desde el inicio \"aburrido\" de la jugada." },
  { n: 2, title: "Mitad del movimiento", desc: "Corta directo a la acción ya en curso, sin introducción." },
  { n: 3, title: "Reacción primero", desc: "Abre con tu cara/reacción de sorpresa o el resultado, y deja que el espectador quiera entender qué pasó." },
  { n: 4, title: "Chat/comentario primero", desc: "Abre con una reacción de chat o de un espectador como gancho de curiosidad." },
];

const SPECS = [
  ["Relación de aspecto", "9:16 vertical siempre — nunca horizontal"],
  ["Subtítulos", "4 a 7 palabras por línea, alto contraste, texto grande, dentro del área segura"],
  ["Duración", "Entre 15 y 30 segundos — corto y contundente"],
  ["Ritmo", "Corta cualquier tramo muerto — ningún corte debe desperdiciarse"],
  ["El loop", "Conecta el último frame con el primero (misma escena) para que el video se repita solo"],
];

export default function Modulo2Contenido() {
  return (
    <div className="module-page" style={{ overflowY: "auto" }}>
      <style>{CREATOR_STYLES}</style>
      <CreatorModuleHeader eyebrow="MÓDULO 2 DE 5" title="Contenido que Funciona" subtitle="Formatos, ganchos y edición móvil" />

      <div style={{ padding: "18px 18px 60px", maxWidth: "720px", margin: "0 auto" }} className="cr-fade">
        <SourceTag>Dato de industria (edición y retención) — no oficial de Garena</SourceTag>

        <CreatorSectionLabel>Por qué el gancho decide todo</CreatorSectionLabel>
        <p style={{ fontSize: "13px", color: "#8A93B8", lineHeight: 1.7, marginBottom: "10px" }}>
          Un estudio de Facebook citado por especialistas en retención encontró que{" "}
          <b style={{ color: "#C8D4F0" }}>el 65% de las personas que ven los primeros 3 segundos de un video se quedan al menos 10 segundos más</b>.
          Si pierdes esa ventana, el video es invisible para el algoritmo — sin importar qué tan buena sea
          la jugada que grabaste.
        </p>

        <CreatorSectionLabel>La Regla de los 2 Segundos</CreatorSectionLabel>
        <p style={{ fontSize: "12.5px", color: "#8A93B8", lineHeight: 1.7, marginBottom: "10px" }}>
          Antes de publicar cualquier clip, mira solo los primeros dos segundos. Si tú mismo no pararías de
          scrollear en ese momento exacto, tu audiencia tampoco lo hará. Busca el punto más temprano donde exista:
        </p>
        <BulletList items={["Movimiento en pantalla", "Audio ocurriendo (disparo, grito, música)", "Algo visualmente interesante (mira apuntando, enemigo, explosión, cara de reacción)"]} />
        <CreatorNote tone="info" title="Si el clip no tiene nada de esto en el segundo 0">
          Recorta más adelante — la acción casi siempre empieza más tarde de lo que crees, y cortar antes
          del punto correcto es el error más común de quien edita clips de juego.
        </CreatorNote>

        <CreatorSectionLabel>4 formas de abrir un clip</CreatorSectionLabel>
        <p style={{ fontSize: "12px", color: "#5A6598", lineHeight: 1.6, marginBottom: "12px" }}>
          En vez de repetir siempre la misma apertura, alterna entre las cuatro — un feed con la misma
          apertura repetida se lee como plantilla y pierde alcance.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {OPENINGS.map((o) => (
            <div key={o.n} style={{ display: "flex", gap: "13px", padding: "13px 14px", borderRadius: "11px", background: "#0C0E18", border: "1px solid #16192A" }}>
              <div style={{ fontFamily: MONO, fontSize: "22px", fontWeight: 700, color: CREATOR.accentDim, width: "26px", flexShrink: 0 }}>{o.n}</div>
              <div>
                <div style={{ fontSize: "13px", fontWeight: 700, color: "#E8DDB0", marginBottom: "3px" }}>{o.title}</div>
                <div style={{ fontSize: "12px", color: "#8A93B8", lineHeight: 1.6 }}>{o.desc}</div>
              </div>
            </div>
          ))}
        </div>

        <CreatorSectionLabel>Especificaciones técnicas</CreatorSectionLabel>
        <p style={{ fontSize: "12px", color: "#5A6598", lineHeight: 1.6, marginBottom: "12px" }}>
          Esto no es opinión, es formato de plataforma.
        </p>
        <div className="data-card" style={{ padding: "6px 16px" }}>
          {SPECS.map(([label, value], i) => (
            <div key={label} style={{ display: "flex", gap: "14px", padding: "12px 0", borderBottom: i < SPECS.length - 1 ? "1px solid #12151F" : "none" }}>
              <div style={{ fontSize: "10.5px", fontWeight: 700, letterSpacing: "0.5px", color: "#5A6598", width: "120px", flexShrink: 0, textTransform: "uppercase" }}>{label}</div>
              <div style={{ fontSize: "12.5px", color: "#8A93B8", lineHeight: 1.55 }}>{value}</div>
            </div>
          ))}
        </div>

        <CreatorSectionLabel>Apps de edición recomendadas</CreatorSectionLabel>
        <p style={{ fontSize: "12px", color: "#5A6598", lineHeight: 1.6, marginBottom: "12px" }}>
          Sin marca de agua, gratis.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "10px" }}>
          <div style={{ padding: "13px 14px", borderRadius: "11px", background: "#0C0E18", border: "1px solid #16192A" }}>
            <div style={{ fontSize: "13.5px", fontWeight: 700, color: "#E8DDB0", marginBottom: "3px" }}>CapCut</div>
            <div style={{ fontSize: "12px", color: "#8A93B8", lineHeight: 1.6 }}>Editor completo, sin marca de agua en el plan gratuito, ideal para contenido estilo TikTok con plantillas de tendencia.</div>
          </div>
          <div style={{ padding: "13px 14px", borderRadius: "11px", background: "#0C0E18", border: "1px solid #16192A" }}>
            <div style={{ fontSize: "13.5px", fontWeight: 700, color: "#E8DDB0", marginBottom: "3px" }}>VN Editor</div>
            <div style={{ fontSize: "12px", color: "#8A93B8", lineHeight: 1.6 }}>100% gratis, sin suscripción, sin funciones bloqueadas — el editor móvil gratuito más completo del mercado.</div>
          </div>
        </div>
        <CreatorNote tone="warn">
          Evita cualquier app que ponga marca de agua en el plan gratuito — eso mata la percepción
          profesional del clip antes de que alguien lo vea completo.
        </CreatorNote>
      </div>
    </div>
  );
}
