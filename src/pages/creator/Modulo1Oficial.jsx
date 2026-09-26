import { CREATOR, CREATOR_STYLES, MONO } from "../../components/creator/creatorTokens.js";
import {
  CreatorModuleHeader, CreatorSectionLabel, CreatorNote, ExpandableCard, BulletList, CardLabel, StepList, SourceTag,
} from "../../components/creator/CreatorUI.jsx";

const RANKS = [
  {
    badge: "🥉",
    color: "#CD7F32",
    title: "Rango Colaborador",
    summary: "Tu punto de entrada",
    entry: [
      "Regístrate en el sitio oficial: creadoresff.garena.com",
      "Vincula tus redes sociales — obligatorio, así el sistema mide tus vistas",
      "Sé creador activo de contenido de Free Fire",
    ],
    renew: [
      "Mínimo 5.000 visualizaciones mensuales",
      "Al menos 50% de tu contenido enfocado en Free Fire",
      "Nada de contenido que viole las normas oficiales",
    ],
    rewards: [
      "Diamantes semanales según tu rendimiento de vistas",
      "Avatar exclusivo al llegar a 5.000 vistas/mes",
      "Banner exclusivo al completar 10 misiones",
      "1 punto por misión completada",
      "Acceso a la biblioteca oficial de recursos para creadores",
    ],
  },
  {
    badge: "🥈",
    color: "#B8BCC8",
    title: "Rango Creador",
    summary: "Nivel intermedio",
    upgrade: ["100.000 visualizaciones mensuales durante 3 meses consecutivos como Colaborador"],
    renew: [
      "100.000 vistas/mes mínimo",
      "4 misiones oficiales completadas al mes",
      "50% del contenido enfocado en Free Fire",
    ],
    rewards: [
      "Todo lo del rango Colaborador, más:",
      "2 puntos por misión (el doble que Colaborador)",
      "Ítems temporales de 2 días para facilitar misiones",
      "Aviso anticipado de nuevas misiones",
      "Pase Booyah Premium para el Top 20 del rango",
    ],
  },
  {
    badge: "🥇",
    color: "#E8B923",
    title: "Rango Influencer",
    summary: "El techo del programa",
    upgrade: [
      "2.500.000 visualizaciones mensuales durante 3 meses consecutivos como Creador",
      "Mínimo 10 videos de Free Fire publicados por mes",
      "4 misiones mensuales completadas",
      "Los ascensos ocurren solo 3 veces al año: enero, mayo y septiembre",
    ],
    rewards: [
      "Diamantes mensuales (no semanales — esquema distinto a los otros rangos)",
      "Insignia oficial de verificado, otorgada recién tras 6 meses continuos en este rango",
      "Objetos y conjuntos permanentes",
      "Reconocimiento oficial de Garena Free Fire",
      "Aviso de misiones con 2 a 5 días de anticipación",
    ],
  },
];

export default function Modulo1Oficial() {
  return (
    <div className="module-page" style={{ overflowY: "auto" }}>
      <style>{CREATOR_STYLES}</style>
      <CreatorModuleHeader
        eyebrow="MÓDULO 1 DE 5"
        title="Camino Oficial"
        subtitle="Programa de Creadores Free Fire LATAM"
      />

      <div style={{ padding: "18px 18px 60px", maxWidth: "720px", margin: "0 auto" }} className="cr-fade">
        <SourceTag>Fuente oficial de Garena — verificado</SourceTag>

        <p style={{ fontSize: "13px", color: "#8A93B8", lineHeight: 1.7, marginBottom: "8px" }}>
          Existe un sistema <b style={{ color: "#C8D4F0" }}>oficial de Garena, exclusivo para Latinoamérica</b>, que
          convierte visualizaciones en diamantes y reconocimiento real. No es rumor de comunidad, no es
          "truco" — es un programa público, con reglas verificables. Este módulo te muestra exactamente
          cómo funciona, para que no pierdas meses adivinando.
        </p>

        <CreatorNote tone="warn" title="Importante">
          Este programa LATAM es distinto al de Brasil — cada región tiene su propio sistema. Todo lo de
          abajo aplica solo si tu audiencia/cuenta está registrada como LATAM.
        </CreatorNote>

        <CreatorSectionLabel>Los 3 rangos</CreatorSectionLabel>

        {RANKS.map((r, i) => (
          <ExpandableCard key={r.title} badge={r.badge} badgeColor={r.color} title={r.title} summary={r.summary} defaultOpen={i === 0}>
            {r.entry && (
              <>
                <CardLabel>Para entrar</CardLabel>
                <BulletList items={r.entry} color={r.color} />
              </>
            )}
            {r.upgrade && (
              <>
                <CardLabel>Para subir desde {i === 1 ? "Colaborador" : "Creador"}</CardLabel>
                <BulletList items={r.upgrade} color={r.color} />
              </>
            )}
            {r.renew && (
              <>
                <CardLabel>Para mantenerte cada mes</CardLabel>
                <BulletList items={r.renew} color={r.color} />
              </>
            )}
            <CardLabel>Lo que ganas</CardLabel>
            <BulletList items={r.rewards} color={r.color} />
          </ExpandableCard>
        ))}

        <CreatorSectionLabel>Cómo se miden tus vistas</CreatorSectionLabel>
        <p style={{ fontSize: "12.5px", color: "#8A93B8", lineHeight: 1.7, marginBottom: "10px" }}>
          Garena usa una herramienta propia llamada <b style={{ color: "#C8D4F0" }}>Garena Social Data</b>,
          bajo el esquema de "Vistas 7" o "Vistas 30" según el requisito que estés evaluando. Solo cuenta:
        </p>
        <BulletList items={["Vistas de canales vinculados al programa", "Contenido identificado con el hashtag #freefire"]} />
        <CreatorNote tone="danger" title="Esto la mayoría no lo sabe">
          Si no vinculaste bien tus redes, tus vistas reales no se contabilizan — aunque tu video explote.
        </CreatorNote>

        <CreatorSectionLabel>El proceso de aplicación</CreatorSectionLabel>
        <StepList
          steps={[
            <>Entra a <b style={{ color: "#C8D4F0" }}>creadoresff.garena.com</b> e inicia sesión con tu cuenta real de Free Fire</>,
            "Completa el formulario con información verídica (datos falsos = rechazo automático)",
            "Vincula todas tus redes sociales",
            "Revisa los términos oficiales del programa",
            <>Envía la solicitud — la revisión puede tardar <b style={{ color: "#C8D4F0" }}>hasta 15 días</b></>,
          ]}
        />

        <CreatorSectionLabel>3 alertas anti-estafa</CreatorSectionLabel>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "8px" }}>
          <CreatorNote tone="danger">El proceso de aplicación es <b>100% gratuito</b>. Cualquier sitio que cobre por "acceso garantizado" te está estafando.</CreatorNote>
          <CreatorNote tone="danger"><b>Ningún rango se compra.</b> La progresión depende solo de tu rendimiento.</CreatorNote>
          <CreatorNote tone="danger">El <b>verificado no se vende</b>, no se compra por ID. Solo se otorga tras 6 meses sostenidos en Influencer.</CreatorNote>
        </div>

        <CreatorSectionLabel>Qué pasa si bajas el ritmo</CreatorSectionLabel>
        <p style={{ fontSize: "12.5px", color: "#8A93B8", lineHeight: 1.7 }}>
          Si no cumples los requisitos de tu rango durante 3 meses consecutivos, bajas automáticamente al
          rango inmediato inferior. <b style={{ color: "#C8D4F0" }}>Consistencia {'>'} pico aislado de vistas.</b>
        </p>
      </div>
    </div>
  );
}
