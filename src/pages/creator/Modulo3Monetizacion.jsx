import { CREATOR, CREATOR_STYLES, MONO } from "../../components/creator/creatorTokens.js";
import {
  CreatorModuleHeader, CreatorSectionLabel, CreatorNote, SimpleTable, SourceTag,
} from "../../components/creator/CreatorUI.jsx";

export default function Modulo3Monetizacion() {
  return (
    <div className="module-page" style={{ overflowY: "auto" }}>
      <style>{CREATOR_STYLES}</style>
      <CreatorModuleHeader eyebrow="MÓDULO 3 DE 5" title="Rutas de Monetización" subtitle="Coaching, boosting, afiliación" />

      <div style={{ padding: "18px 18px 60px", maxWidth: "720px", margin: "0 auto" }} className="cr-fade">
        <SourceTag>Dato de mercado/industria gaming — no oficial de Garena</SourceTag>

        <CreatorSectionLabel>El panorama honesto</CreatorSectionLabel>
        <p style={{ fontSize: "13px", color: "#8A93B8", lineHeight: 1.7, marginBottom: "14px" }}>
          No hay una sola forma de monetizar — hay un <b style={{ color: "#C8D4F0" }}>orden</b>. Algunas rutas
          funcionan desde el día 1 con poca audiencia; otras necesitan volumen antes de generar un dólar.
          Ordenadas de más accesible a menos:
        </p>

        <SimpleTable
          columns={["Ruta", "Escala necesaria", "Esfuerzo para arrancar", "Ingreso típico/mes"]}
          rows={[
            ["Enlaces de afiliado", "Cualquiera (500+ seguidores activos)", "2 horas", "$50 – $2.000+"],
            ["Donaciones directas (Ko-fi, Buy Me a Coffee)", "1.000+ seguidores activos", "2 horas", "$30 – $1.000+"],
            ["Suscripciones/bits (Twitch, TikTok LIVE)", "~50 seguidores + horas vistas", "~30 días para calificar", "$20 – $5.000"],
            ["AdSense / fondo de creadores YouTube", "1.000 suscriptores + 4.000h vistas", "Meses para calificar", "$10 – $3.000"],
            ["Contenido patrocinado puntual", "10.000+ seguidores activos", "Contacto y negociación", "$200 – $10.000/acuerdo"],
          ]}
        />
        <CreatorNote tone="info" title="Lectura clave">
          Empieza por afiliación y donaciones — no requieren audiencia grande. Contenido patrocinado es la
          ruta de mayor pago, pero es la última en desbloquearse, porque las marcas solo pagan cuando ya
          hay audiencia real que justifique el gasto.
        </CreatorNote>

        <CreatorSectionLabel>Coaching 1 a 1</CreatorSectionLabel>
        <p style={{ fontSize: "12.5px", color: "#8A93B8", lineHeight: 1.7, marginBottom: "10px" }}>
          Vender tu habilidad, no solo tu contenido. Existe un mercado real y activo de coaching gaming
          (ej. la plataforma Metafy), donde jugadores buenos cobran por sesiones individuales:
        </p>
        <div className="data-card" style={{ padding: "14px 16px", marginBottom: "10px" }}>
          <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
            <div>
              <div style={{ fontSize: "9.5px", letterSpacing: "1.5px", color: "#5A6598", textTransform: "uppercase", marginBottom: "4px" }}>Tarifa</div>
              <div style={{ fontFamily: MONO, fontSize: "20px", fontWeight: 700, color: "#E8DDB0" }}>$15–$100<span style={{ fontSize: "12px", color: "#5A6598" }}>/hora</span></div>
            </div>
            <div>
              <div style={{ fontSize: "9.5px", letterSpacing: "1.5px", color: "#5A6598", textTransform: "uppercase", marginBottom: "4px" }}>Comisión de plataforma</div>
              <div style={{ fontFamily: MONO, fontSize: "20px", fontWeight: 700, color: "#E8DDB0" }}>~5%</div>
            </div>
          </div>
          <div style={{ fontSize: "12px", color: "#8A93B8", lineHeight: 1.6, marginTop: "10px" }}>
            No necesitas ser profesional de esports — necesitas ser mejor que la persona que te contrata.
          </div>
        </div>
        <CreatorNote tone="warn">
          A confirmar antes de aplicar: si existe una plataforma equivalente activa específicamente para
          Free Fire en tu región, o si el camino más realista es ofrecer coaching de forma independiente
          (WhatsApp/Discord + cobro directo).
        </CreatorNote>

        <CreatorSectionLabel>Afiliación</CreatorSectionLabel>
        <p style={{ fontSize: "12.5px", color: "#8A93B8", lineHeight: 1.7 }}>
          Recomendar productos/servicios relacionados a gaming (accesorios, apps de edición,
          sensibilidad/hardware) a cambio de comisión por venta.{" "}
          <b style={{ color: "#C8D4F0" }}>La afiliación es acumulativa, no de "dinero rápido"</b> — el
          ingreso crece con la audiencia y la constancia, no con un solo post viral.
        </p>

        <CreatorSectionLabel>Boosting de cuenta</CreatorSectionLabel>
        <CreatorNote tone="danger" title="La ruta que exige una advertencia">
          Subir el rango de la cuenta de otro jugador por pago es una práctica real y común en el
          ecosistema gaming — pero <b>suele violar los términos de servicio del juego</b>, con riesgo de
          sanción para la cuenta del cliente. Esto se presenta como información, no como recomendación sin
          reservas — conoce el riesgo antes de ofrecer o contratar el servicio.
        </CreatorNote>

        <CreatorSectionLabel>Contenido patrocinado</CreatorSectionLabel>
        <p style={{ fontSize: "12.5px", color: "#8A93B8", lineHeight: 1.7 }}>
          La ruta de mayor pago, la última en llegar. Rango de mercado general para acuerdos puntuales de
          marca: <b style={{ color: "#C8D4F0" }}>$200 a $10.000 por acuerdo</b>, dependiendo del tamaño de
          audiencia y de la negociación. Solo se vuelve accesible con 10.000+ seguidores activos — no es
          punto de partida, es meta.
        </p>
      </div>
    </div>
  );
}
