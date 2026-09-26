import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CREATOR, CREATOR_STYLES, MONO } from "../../components/creator/creatorTokens.js";
import {
  CreatorModuleHeader, CreatorSectionLabel, CreatorNote, BulletList,
} from "../../components/creator/CreatorUI.jsx";

const AGE_GATE_KEY = "fh_creator_retos_18plus";

const FORMATS = [
  {
    title: "Formato 1 — Duelo 1v1 simple",
    desc: "La versión más básica: dos jugadores acuerdan antes de empezar cuánto pone cada uno y qué determina al ganador (mejor de 3 rounds, primera muerte, etc.).",
    rules: [
      "Acordar todo antes de la partida, nunca a mitad de juego — cambiar los términos sobre la marcha es la causa #1 de peleas",
      "Un tercero neutral confirma el resultado — evita el \"yo gané, tú perdiste\" sin prueba",
      "Grabar la partida (esto además te da contenido gratis para el Módulo 2)",
    ],
  },
  {
    title: "Formato 2 — Torneo interno del squad",
    desc: "Para grupos más grandes (6, 8, 10 jugadores), con un premio acumulado (pozo) para el primer lugar.",
    rules: [
      "Cada participante pone el mismo monto de entrada — se forma un pozo para el primer lugar",
      "Se define el formato antes de empezar: eliminación directa, todos contra todos, o suma de puntos",
      "Se designa una persona que no juega para organizar el bracket y confirmar resultados",
      "El premio puede ser 100% dinero, o mixto (dinero + algo simbólico, como elegir el próximo modo de juego)",
    ],
  },
  {
    title: "Formato 3 — Liga semanal / mensual",
    desc: "Versión recurrente del Formato 2 — el mismo grupo compite varias semanas seguidas, acumulando puntos, y el pozo se reparte al final del mes.",
    rules: [
      "Le da al contenido del Módulo 2 una razón constante para existir: cada semana hay una nueva ronda que grabar y publicar",
    ],
  },
];

function AgeGate({ onConfirm, onBack }) {
  return (
    <div className="module-page" style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
      <style>{CREATOR_STYLES}</style>
      <div className="cr-fade" style={{ maxWidth: "420px", width: "100%", textAlign: "center" }}>
        <div style={{ width: "56px", height: "56px", borderRadius: "16px", margin: "0 auto 18px", background: "rgba(229,83,83,0.1)", border: "1px solid rgba(229,83,83,0.3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#E58A8A" strokeWidth="1.7"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
        </div>
        <div style={{ fontFamily: MONO, fontSize: "20px", fontWeight: 700, letterSpacing: "1px", color: "#E8DDB0", marginBottom: "10px" }}>
          Contenido para mayores de edad
        </div>
        <p style={{ fontSize: "13px", color: "#8A93B8", lineHeight: 1.7, marginBottom: "16px", textAlign: "left" }}>
          Este módulo describe una práctica social entre grupos de jugadores adultos: retos amistosos con
          dinero propio, acordados entre las partes. <b style={{ color: "#C8D4F0" }}>No es un sistema de
          apuestas, no tiene casas de apuestas, cuotas ni gestión de cobros</b> — es una guía para organizar
          algo que un grupo de amigos ya podría estar haciendo de forma desordenada.
        </p>
        <p style={{ fontSize: "12px", color: "#5A6598", lineHeight: 1.6, marginBottom: "22px", textAlign: "left" }}>
          Confirma que tienes 18 años o más para continuar.
        </p>
        <button
          onClick={onConfirm}
          className="cr-btn"
          style={{ width: "100%", padding: "13px", borderRadius: "10px", background: CREATOR.accent, border: "none", color: "#0A0612", fontSize: "13px", fontWeight: 800, letterSpacing: "1px", textTransform: "uppercase", marginBottom: "10px" }}
        >
          Tengo 18 años o más
        </button>
        <button
          onClick={onBack}
          className="cr-btn"
          style={{ width: "100%", padding: "12px", borderRadius: "10px", background: "none", border: "1px solid #16192A", color: "#5A6598", fontSize: "12px", fontWeight: 600 }}
        >
          Volver a los módulos
        </button>
      </div>
    </div>
  );
}

export default function Modulo4Retos() {
  const navigate = useNavigate();
  const [unlocked, setUnlocked] = useState(
    () => typeof window !== "undefined" && localStorage.getItem(AGE_GATE_KEY) === "true"
  );

  if (!unlocked) {
    return (
      <AgeGate
        onConfirm={() => {
          localStorage.setItem(AGE_GATE_KEY, "true");
          setUnlocked(true);
        }}
        onBack={() => navigate("/creator")}
      />
    );
  }

  return (
    <div className="module-page" style={{ overflowY: "auto" }}>
      <style>{CREATOR_STYLES}</style>
      <CreatorModuleHeader eyebrow="MÓDULO 4 DE 5" title="Retos entre Amigos, Organizado" subtitle="Estructura social, no apuestas reales" />

      <div style={{ padding: "18px 18px 60px", maxWidth: "720px", margin: "0 auto" }} className="cr-fade">
        <CreatorNote tone="danger" title="Léelo antes de seguir">
          Este módulo describe una práctica social común entre grupos de jugadores adultos (retos con
          dinero propio, acordados entre las partes) — no un sistema de apuestas ni una casa de apuestas.
          No incluye mecánicas de cuotas, escalado de montos, ni gestión de cobros: eso queda fuera a propósito.
        </CreatorNote>

        <CreatorSectionLabel>La idea central</CreatorSectionLabel>
        <p style={{ fontSize: "12.5px", color: "#8A93B8", lineHeight: 1.7 }}>
          Entre amigos que ya juegan juntos, es común convertir una partida en un reto con algo en juego —
          no como negocio, sino como forma de subir la intensidad de un juego que ya jugarían gratis. Este
          módulo da estructura a algo que el grupo probablemente ya hace de forma desordenada.
        </p>

        {FORMATS.map((f) => (
          <div key={f.title}>
            <CreatorSectionLabel>{f.title}</CreatorSectionLabel>
            <p style={{ fontSize: "12.5px", color: "#8A93B8", lineHeight: 1.7, marginBottom: "10px" }}>{f.desc}</p>
            <BulletList items={f.rules} />
          </div>
        ))}

        <CreatorSectionLabel>Reglas de sentido común</CreatorSectionLabel>
        <div className="data-card" style={{ padding: "15px 16px" }}>
          <BulletList
            items={[
              "Jugar solo con dinero que la persona puede permitirse perder sin que le afecte — esto es para diversión entre amigos, no para intentar recuperar pérdidas",
              "Nunca subir el monto para \"recuperar\" lo perdido en la ronda anterior",
              "Esto es un acuerdo privado entre adultos que ya se conocen — no una recomendación para apostar con desconocidos ni en plataformas de terceros",
            ]}
          />
        </div>
      </div>
    </div>
  );
}
