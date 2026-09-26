import { CREATOR, CREATOR_STYLES, MONO } from "../../components/creator/creatorTokens.js";
import {
  CreatorModuleHeader, CreatorSectionLabel, CreatorNote, SourceTag,
} from "../../components/creator/CreatorUI.jsx";

const PHASES = [
  {
    range: "Días 1–30",
    title: "Publica con consistencia",
    desc: "3–5 clips/semana en TikTok y YouTube Shorts. Objetivo: aprender qué tipo de clip retiene más (usa los 4 patrones de apertura del Módulo 2).",
  },
  {
    range: "Días 31–60",
    title: "Dobla lo que funciona",
    desc: "Ya tienes datos propios de qué formato funciona. Dobla la frecuencia en el formato que mejor retuvo, sin abandonar el otro.",
  },
  {
    range: "Días 61–90",
    title: "Aplica al programa oficial",
    desc: "Con el ritmo sostenido, deberías estar cerca o dentro del umbral de 5.000 vistas/mes — el momento de aplicar al Programa de Creadores como Colaborador.",
  },
];

export default function Modulo5Canal() {
  return (
    <div className="module-page" style={{ overflowY: "auto" }}>
      <style>{CREATOR_STYLES}</style>
      <CreatorModuleHeader eyebrow="MÓDULO 5 DE 5" title="Creando tu Canal desde Cero" subtitle="Posicionamiento y primeros 90 días" />

      <div style={{ padding: "18px 18px 60px", maxWidth: "720px", margin: "0 auto" }} className="cr-fade">
        <SourceTag>Dato de industria (crecimiento en video corto) — no oficial de Garena</SourceTag>

        <CreatorSectionLabel>TikTok vs. YouTube Shorts</CreatorSectionLabel>
        <p style={{ fontSize: "12px", color: "#5A6598", lineHeight: 1.6, marginBottom: "12px" }}>
          No es "cuál es mejor", es "para qué sirve cada uno".
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "14px" }}>
          <div className="data-card" style={{ padding: "14px" }}>
            <div style={{ fontFamily: MONO, fontSize: "15px", fontWeight: 700, color: "#E8DDB0", marginBottom: "8px" }}>TikTok</div>
            <div style={{ fontSize: "9.5px", letterSpacing: "1px", color: CREATOR.accent, textTransform: "uppercase", marginBottom: "6px" }}>Motor de alcance</div>
            <div style={{ fontSize: "12px", color: "#8A93B8", lineHeight: 1.6 }}>Gana en alcance puro y descubrimiento de audiencia nueva. Un clip con tracción modesta puede llegar a más de 100.000 vistas en 48 horas.</div>
          </div>
          <div className="data-card" style={{ padding: "14px" }}>
            <div style={{ fontFamily: MONO, fontSize: "15px", fontWeight: 700, color: "#E8DDB0", marginBottom: "8px" }}>YouTube Shorts</div>
            <div style={{ fontSize: "9.5px", letterSpacing: "1px", color: CREATOR.accent, textTransform: "uppercase", marginBottom: "6px" }}>Motor de conversión</div>
            <div style={{ fontSize: "12px", color: "#8A93B8", lineHeight: 1.6 }}>Convierte mejor en seguidores leales — su algoritmo se apoya más en búsqueda, así que un buen título sigue trayendo vistas semanas después.</div>
          </div>
        </div>
        <CreatorNote tone="info">
          La estrategia correcta no es elegir uno — es usar TikTok como motor de alcance y YouTube Shorts
          como motor de conversión, publicando el mismo clip editado en ambos.
        </CreatorNote>

        <CreatorSectionLabel>La fórmula de título para YouTube Shorts</CreatorSectionLabel>
        <p style={{ fontSize: "12.5px", color: "#8A93B8", lineHeight: 1.7, marginBottom: "12px" }}>
          En TikTok, el texto en pantalla es lo que importa. En YouTube Shorts,{" "}
          <b style={{ color: "#C8D4F0" }}>el título es tu gancho de búsqueda principal</b>.
        </p>
        <div style={{ padding: "13px 15px", borderRadius: "11px", background: CREATOR.accentBg, border: `1px solid ${CREATOR.accentBorder}`, marginBottom: "12px", textAlign: "center", fontFamily: MONO, fontSize: "13px", color: CREATOR.accent, fontWeight: 700, letterSpacing: "0.5px" }}>
          [Qué pasó] + [Free Fire] + [Contexto/dificultad opcional]
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "8px" }}>
          <div style={{ display: "flex", gap: "8px", alignItems: "center", fontSize: "12.5px", color: "#8A93B8" }}>
            <span style={{ color: "#22C97A" }}>✓</span> "Squad wipe solo, Free Fire ranked"
          </div>
          <div style={{ display: "flex", gap: "8px", alignItems: "center", fontSize: "12.5px", color: "#8A93B8" }}>
            <span style={{ color: "#22C97A" }}>✓</span> "Clutch 1v4 Free Fire, Grandmaster"
          </div>
          <div style={{ display: "flex", gap: "8px", alignItems: "center", fontSize: "12.5px", color: "#6A5A5A" }}>
            <span style={{ color: "#E58A8A" }}>✕</span> "esto fue una locura #shorts" — no le dice nada buscable al algoritmo
          </div>
        </div>

        <CreatorSectionLabel>Frecuencia realista</CreatorSectionLabel>
        <p style={{ fontSize: "12.5px", color: "#8A93B8", lineHeight: 1.7 }}>
          Empieza con <b style={{ color: "#C8D4F0" }}>1 clip por día</b> y sube el ritmo gradualmente. Un
          ritmo base sólido y sostenible: <b style={{ color: "#C8D4F0" }}>3 a 5 clips por semana</b>, en
          ambas plataformas — publicar mucho con calidad baja no genera crecimiento, solo desgaste.
        </p>

        <CreatorSectionLabel>Tus primeros 90 días</CreatorSectionLabel>
        <p style={{ fontSize: "12px", color: "#5A6598", lineHeight: 1.6, marginBottom: "14px" }}>
          El error más común es medir el éxito por "¿se volvió viral?". La meta real es más aburrida y más
          alcanzable: llegar a las 5.000 visualizaciones mensuales que pide el Rango Colaborador del Módulo 1.
        </p>

        <div style={{ position: "relative", paddingLeft: "26px" }}>
          <div style={{ position: "absolute", left: "9px", top: "10px", bottom: "10px", width: "2px", background: "#16192A" }} />
          {PHASES.map((p, i) => (
            <div key={p.range} style={{ position: "relative", marginBottom: i < PHASES.length - 1 ? "18px" : 0 }}>
              <div style={{ position: "absolute", left: "-26px", top: "2px", width: "20px", height: "20px", borderRadius: "50%", background: "#0C0E18", border: `2px solid ${CREATOR.accent}`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: MONO, fontSize: "10px", fontWeight: 700, color: CREATOR.accent }}>
                {i + 1}
              </div>
              <div style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "1.5px", color: CREATOR.accent, textTransform: "uppercase", marginBottom: "3px" }}>{p.range}</div>
              <div style={{ fontFamily: MONO, fontSize: "15px", fontWeight: 700, color: "#E8DDB0", marginBottom: "4px" }}>{p.title}</div>
              <div style={{ fontSize: "12.5px", color: "#8A93B8", lineHeight: 1.6 }}>{p.desc}</div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: "20px" }}>
          <CreatorNote tone="ok" title="Este orden importa">
            Entra al programa oficial ya con el hábito de publicar constante, no antes — entrar sin
            consistencia solo te hace perder el rango al primer mes flojo.
          </CreatorNote>
        </div>
      </div>
    </div>
  );
}
