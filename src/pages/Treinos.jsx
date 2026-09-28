import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { collection, getDocs } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { db } from "../firebase";
import { readLegacyCatalog } from "../domain/legacyCatalog.js";
import { useClipboard } from "../hooks/useClipboard.js";
import { CopyFallback } from "../components/CatalogNotice.jsx";
import RadarSonoroTrainer from "../components/RadarSonoroTrainer.jsx";

const STYLES = `
  @keyframes shimmer {
    0% { background-position: -200% center; }
    100% { background-position: 200% center; }
  }
  @keyframes card-in {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes timer-glow {
    0%, 100% { box-shadow: 0 0 0 0 rgba(212,160,23,0.3); }
    50% { box-shadow: 0 0 0 8px rgba(212,160,23,0); }
  }
  .treino-card { animation: card-in 0.4s ease both; }
  .cat-scroll::-webkit-scrollbar { display: none; }
  .cat-scroll { -ms-overflow-style: none; scrollbar-width: none; }
`;

const CATS = {
  "Todos":            { icon: "⚡", color: "#D4A017" },
  "Radar Sonoro":     { icon: "🎧", color: "#F0C040", bono: true },
  "Warm-Up":          { icon: "🌡️", color: "#1A6FA8" },
  "Headshot":         { icon: "🎯", color: "#C0392B" },
  "Arrastre":         { icon: "🔄", color: "#D4A017" },
  "Capa":             { icon: "🧱", color: "#1E8C4A" },
  "Crouch-Shot":      { icon: "🦆", color: "#8E44AD" },
  "AWM":              { icon: "🔭", color: "#C0392B" },
  "Rush":             { icon: "🔥", color: "#E67E22" },
  "Movimentação":     { icon: "⚡", color: "#1A6FA8" },
  "Troca de Arma":    { icon: "🔫", color: "#D4A017" },
  "Memoria Muscular": { icon: "🧠", color: "#8E44AD" },
  "Ranked":           { icon: "🏆", color: "#D4A017" },
  "Posicionamento":   { icon: "📍", color: "#1E8C4A" },
};

function getLevelCfg(level) {
  const l = level?.toLowerCase() || "";
  if (l.includes("avan")) return { label: "AVANZADO",   color: "#C0392B", bg: "rgba(192,57,43,0.12)" };
  if (l.includes("inter")) return { label: "INTERMEDIO", color: "#D4A017", bg: "rgba(212,160,23,0.12)" };
  return { label: "INICIANTE", color: "#1A6FA8", bg: "rgba(26,111,168,0.12)" };
}

function getCatCfg(cat) { return CATS[cat] || { icon: "⚡", color: "#D4A017" }; }

function Toast({ visible }) {
  return (
    <div style={{
      position: "fixed",
      bottom: "calc(28px + env(safe-area-inset-bottom,0px))",
      left: "50%",
      transform: `translateX(-50%) translateY(${visible ? 0 : 16}px)`,
      opacity: visible ? 1 : 0,
      transition: "all 0.3s cubic-bezier(.34,1.56,.64,1)",
      background: "linear-gradient(90deg,#8A6610,#D4A017,#F0C040,#D4A017)",
      backgroundSize: "200% auto",
      animation: visible ? "shimmer 1.5s linear infinite" : "none",
      color: "#000",
      fontFamily: "'Rajdhani',sans-serif",
      fontWeight: 800,
      fontSize: "13px",
      letterSpacing: "2px",
      padding: "10px 28px",
      borderRadius: "99px",
      boxShadow: "0 8px 32px rgba(212,160,23,0.45)",
      zIndex: 999,
      pointerEvents: "none",
      whiteSpace: "nowrap",
    }}>✓ ENTRENAMIENTO COPIADO</div>
  );
}

function Timer({ duration, onClose }) {
  const match = duration?.match(/(\d+)/);
  const total = match ? parseInt(match[1]) * 60 : 300;
  const [secs, setSecs] = useState(total);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (running) {
      ref.current = setInterval(() => {
        setSecs(s => {
          if (s <= 1) { clearInterval(ref.current); setRunning(false); setDone(true); return 0; }
          return s - 1;
        });
      }, 1000);
    }
    return () => clearInterval(ref.current);
  }, [running]);

  const reset = () => { setSecs(total); setRunning(false); setDone(false); };
  const pct = ((total - secs) / total) * 100;
  const m = Math.floor(secs / 60).toString().padStart(2,"0");
  const s = (secs % 60).toString().padStart(2,"0");
  const r = 36;
  const circ = 2 * Math.PI * r;

  return (
    <div style={{
      background: "linear-gradient(135deg,rgba(212,160,23,0.08),rgba(0,0,0,0))",
      border: "1px solid rgba(212,160,23,0.25)",
      borderRadius: "14px",
      padding: "16px",
      marginBottom: "14px",
      display: "flex",
      alignItems: "center",
      gap: "16px",
      animation: running ? "timer-glow 2s infinite" : "none",
    }}>
      <div style={{ position: "relative", flexShrink: 0 }}>
        <svg width="88" height="88" style={{ transform: "rotate(-90deg)" }}>
          <circle cx="44" cy="44" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="5"/>
          <circle cx="44" cy="44" r={r} fill="none"
            stroke={done ? "#1E8C4A" : running ? "#D4A017" : "rgba(212,160,23,0.3)"}
            strokeWidth="5"
            strokeDasharray={circ}
            strokeDashoffset={circ * (1 - pct / 100)}
            strokeLinecap="round"
            style={{ transition: "stroke-dashoffset 1s linear, stroke 0.3s" }}
          />
        </svg>
        <div style={{ position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center" }}>
          <div style={{ fontFamily:"'Bebas Neue',sans-serif",fontSize:"20px",color:done?"#1E8C4A":running?"#D4A017":"var(--text)",lineHeight:1,letterSpacing:"1px" }}>{m}:{s}</div>
          <div style={{ fontSize:"8px",color:"var(--text-muted)",letterSpacing:"1px",marginTop:"2px" }}>{done?"LISTO":running?"ACTIVO":"PAUSA"}</div>
        </div>
      </div>
      <div style={{ flex:1 }}>
        <div style={{ fontSize:"10px",color:"var(--text-muted)",letterSpacing:"2px",textTransform:"uppercase",marginBottom:"10px" }}>
          {done ? "✓ Completado" : `Duración: ${duration}`}
        </div>
        <div style={{ display:"flex",gap:"6px" }}>
          <button onClick={() => done ? reset() : setRunning(r=>!r)} style={{
            flex:1,padding:"9px",borderRadius:"8px",border:"none",
            background: done?"#1E8C4A":running?"rgba(192,57,43,0.18)":"linear-gradient(90deg,#8A6610,#D4A017)",
            color:done?"#fff":running?"#C0392B":"#000",
            fontFamily:"'Rajdhani',sans-serif",fontWeight:800,fontSize:"12px",letterSpacing:"1.5px",cursor:"pointer",
          }}>{done?"↺ REPETIR":running?"⏸ PAUSAR":"▶ INICIAR"}</button>
          {!done && <button onClick={reset} style={{ width:"36px",borderRadius:"8px",border:"1px solid var(--border)",background:"var(--surface2)",color:"var(--text-muted)",cursor:"pointer",fontSize:"14px" }}>↺</button>}
          <button onClick={onClose} style={{ width:"36px",borderRadius:"8px",border:"1px solid var(--border)",background:"var(--surface2)",color:"var(--text-muted)",cursor:"pointer",fontSize:"14px" }}>✕</button>
        </div>
      </div>
    </div>
  );
}

function TreinoCard({ t, idx, onCopy }) {
  const [expanded, setExpanded] = useState(false);
  const [showTimer, setShowTimer] = useState(false);
  const steps = t.steps?.split("\n").filter(Boolean) || [];
  const cat = getCatCfg(t.category);
  const lv = getLevelCfg(t.level);

  return (
    <div className="treino-card" style={{ animationDelay:`${idx*0.05}s`,background:"var(--surface)",border:"1px solid var(--border)",borderRadius:"16px",overflow:"hidden",position:"relative",transition:"border-color 0.2s" }}
      onMouseEnter={e=>e.currentTarget.style.borderColor=cat.color+"66"}
      onMouseLeave={e=>e.currentTarget.style.borderColor="var(--border)"}
    >
      {/* Acento topo */}
      <div style={{ height:"3px",background:`linear-gradient(90deg,${cat.color}00,${cat.color},${cat.color}00)` }}/>

      {/* Header */}
      <div style={{ padding:"14px 14px 12px",background:`linear-gradient(135deg,${cat.color}12 0%,transparent 60%)`,borderBottom:"1px solid var(--border)",position:"relative",overflow:"hidden" }}>
        {/* Ícone decorativo */}
        <div style={{ position:"absolute",right:"10px",top:"50%",transform:"translateY(-50%)",fontSize:"56px",opacity:0.06,userSelect:"none",lineHeight:1,pointerEvents:"none" }}>{cat.icon}</div>

        {/* Badges */}
        <div style={{ display:"flex",gap:"5px",flexWrap:"wrap",marginBottom:"8px" }}>
          <span style={{ display:"inline-flex",alignItems:"center",gap:"4px",background:`${cat.color}18`,border:`1px solid ${cat.color}44`,color:cat.color,fontSize:"9px",fontWeight:800,letterSpacing:"1.5px",padding:"3px 10px",borderRadius:"99px",textTransform:"uppercase" }}>
            {cat.icon} {t.category}
          </span>
          <span style={{ display:"inline-block",background:lv.bg,border:`1px solid ${lv.color}44`,color:lv.color,fontSize:"9px",fontWeight:800,letterSpacing:"1.5px",padding:"3px 10px",borderRadius:"99px",textTransform:"uppercase" }}>
            {lv.label}
          </span>
        </div>

        {/* Título */}
        <div style={{ fontFamily:"'Rajdhani',sans-serif",fontSize:"18px",fontWeight:800,color:"var(--text)",lineHeight:1.2,marginBottom:"6px",paddingRight:"40px" }}>
          {t.title}
        </div>

        {/* Meta */}
        <div style={{ display:"flex",gap:"12px" }}>
          <span style={{ fontSize:"11px",color:"var(--text-muted)",display:"flex",alignItems:"center",gap:"4px" }}>
            <span style={{ color:cat.color }}>⏱</span>{t.duration}
          </span>
          <span style={{ fontSize:"11px",color:"var(--text-muted)",display:"flex",alignItems:"center",gap:"4px" }}>
            <span style={{ color:cat.color }}>🔁</span>{t.frequency}
          </span>
        </div>
      </div>

      {/* Body */}
      <div style={{ padding:"13px 14px" }}>
        {/* Descrição */}
        <div style={{ fontSize:"12px",color:"rgba(232,224,204,0.5)",lineHeight:1.7,marginBottom:"13px" }}>
          {t.description}
        </div>

        {/* Timer */}
        {showTimer && <Timer duration={t.duration} onClose={()=>setShowTimer(false)}/>}

        {/* Steps header */}
        <div style={{ display:"flex",alignItems:"center",gap:"8px",marginBottom:"8px" }}>
          <div style={{ width:"3px",height:"12px",background:cat.color,borderRadius:"2px",flexShrink:0 }}/>
          <span style={{ fontSize:"9px",fontWeight:800,letterSpacing:"2px",color:cat.color,textTransform:"uppercase" }}>Pasos</span>
          <div style={{ flex:1,height:"1px",background:`linear-gradient(90deg,${cat.color}44,transparent)` }}/>
        </div>

        {/* Steps */}
        <div style={{ display:"flex",flexDirection:"column",gap:"5px",marginBottom:"10px" }}>
          {(expanded ? steps : steps.slice(0,3)).map((s,i)=>{
            const clean = s.replace(/^[•-]\s*/,"").trim();
            if(!clean) return null;
            return (
              <div key={i} style={{ display:"flex",gap:"9px",alignItems:"flex-start",padding:"7px 10px",background:i%2===0?"var(--surface2)":"rgba(255,255,255,0.02)",border:`1px solid ${i===0?cat.color+"22":"var(--border)"}`,borderRadius:"8px" }}>
                <span style={{ width:"19px",height:"19px",borderRadius:"5px",background:`${cat.color}18`,border:`1px solid ${cat.color}33`,color:cat.color,fontSize:"10px",fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginTop:"1px" }}>
                  {i+1}
                </span>
                <span style={{ fontSize:"12px",color:"rgba(232,224,204,0.75)",lineHeight:1.6 }}>{clean}</span>
              </div>
            );
          })}
        </div>

        {steps.length > 3 && (
          <button onClick={()=>setExpanded(!expanded)} style={{ width:"100%",padding:"7px",background:"transparent",border:`1px dashed ${cat.color}33`,borderRadius:"8px",color:cat.color,fontSize:"10px",fontWeight:700,letterSpacing:"1px",textTransform:"uppercase",cursor:"pointer",marginBottom:"10px",transition:"all 0.2s" }}>
            {expanded ? "▲ Ver menos" : `▼ Ver ${steps.length-3} pasos más`}
          </button>
        )}

        {/* Nota */}
        {t.notes && (
          <div style={{ display:"flex",gap:"8px",alignItems:"flex-start",padding:"9px 11px",background:`${cat.color}08`,border:`1px solid ${cat.color}22`,borderRadius:"10px",marginBottom:"12px" }}>
            <span style={{ fontSize:"13px",flexShrink:0 }}>💡</span>
            <span style={{ fontSize:"11px",color:"rgba(232,224,204,0.55)",lineHeight:1.6 }}>{t.notes}</span>
          </div>
        )}

        {/* Botões */}
        <div style={{ display:"flex",gap:"7px" }}>
          <button onClick={()=>setShowTimer(!showTimer)} style={{ flex:1,padding:"10px 6px",borderRadius:"10px",border:`1px solid ${showTimer?cat.color:"var(--border)"}`,background:showTimer?`${cat.color}14`:"var(--surface2)",color:showTimer?cat.color:"var(--text-muted)",fontSize:"11px",fontWeight:700,letterSpacing:"1px",textTransform:"uppercase",cursor:"pointer",transition:"all 0.2s",display:"flex",alignItems:"center",justifyContent:"center",gap:"4px" }}>
            ⏱ Timer
          </button>
          <button onClick={()=>onCopy(t)} style={{ flex:2,padding:"10px",borderRadius:"10px",border:"none",background:`linear-gradient(90deg,${cat.color}bb,${cat.color})`,color:"#000",fontFamily:"'Rajdhani',sans-serif",fontWeight:800,fontSize:"13px",letterSpacing:"1.5px",textTransform:"uppercase",cursor:"pointer",transition:"all 0.2s",display:"flex",alignItems:"center",justifyContent:"center",gap:"5px",boxShadow:`0 4px 14px ${cat.color}33` }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
            </svg>
            COPIAR
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Treinos() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [category, setCategory] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("cat") || "Todos";
  });
  const [level, setLevel] = useState("Todos");
  const { toast, manualText, copy, closeManual } = useClipboard();

  const filtered = useMemo(() => items
    .filter(i => category==="Todos" || i.category===category)
    .filter(i => level==="Todos" || i.level?.toLowerCase().includes(level.toLowerCase()))
  ,[items,category,level]);

  useEffect(()=>{
    async function fetchAll() {
      setLoading(true);
      try {
        const snap = await getDocs(collection(db,"treinos"));
        setItems(readLegacyCatalog("treinos", snap.docs.map(d=>({...d.data(),id:d.id})), { transport: true }));
      } catch { setError("Error al cargar."); }
      finally { setLoading(false); }
    }
    fetchAll();
  },[]);

  const handleCopy = useCallback((t)=>{
    void copy(`Rutina recomendada por FullHead.\n⚡ ${t.title}\n━━━━━━━━━━━━━━━━\nCategoría: ${t.category}\nNivel: ${t.level}\nDuración: ${t.duration}\nFrecuencia: ${t.frequency}\n━━━━━━━━━━━━━━━━\n${t.steps}${t.notes?`\n\n💡 ${t.notes}`:""}\nPanel FullHead ⚡`);

  },[copy]);

  return (
    <div className="module-page">
      <style>{STYLES}</style>
      <Toast visible={toast}/>
      <CopyFallback text={manualText} onClose={closeManual} />

      <div className="module-header">
        <button className="module-back-btn" onClick={()=>navigate("/")} title="Volver">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <div>
          <div className="module-title">Entrenamientos Diarios</div>
          <div className="module-subtitle">Rutinas pro para mejorar tu destreza</div>
        </div>
      </div>

      <div style={{ padding:"16px 14px 80px" }}>

        {/* Banner */}
        <div style={{ background:"linear-gradient(135deg,rgba(212,160,23,0.1),rgba(212,160,23,0.03))",border:"1px solid rgba(212,160,23,0.2)",borderRadius:"12px",padding:"12px 14px",marginBottom:"16px",display:"flex",gap:"10px",alignItems:"center" }}>
          <span style={{ fontSize:"24px",flexShrink:0 }}>⚡</span>
          <div>
            <div style={{ fontSize:"11px",fontWeight:800,color:"var(--gold)",letterSpacing:"1px",textTransform:"uppercase",marginBottom:"2px" }}>Método FullHead</div>
            <div style={{ fontSize:"11px",color:"var(--text-muted)",lineHeight:1.5 }}>Rutinas recomendadas para practicar en el juego. Usa el temporizador como guía; puede pausarse al cambiar de aplicación.</div>
          </div>
        </div>

        {/* Filtro categorias */}
        <div className="cat-scroll" style={{ overflowX:"auto",marginBottom:"10px" }}>
          <div style={{ display:"flex",gap:"6px",width:"max-content",paddingBottom:"2px" }}>
            {Object.entries(CATS).map(([cat,cfg])=>(
              <button key={cat} onClick={()=>setCategory(cat)} style={{ position:"relative", display:"inline-flex",alignItems:"center",gap:"4px",padding:"6px 13px",borderRadius:"99px",border:`1px solid ${category===cat?cfg.color:"var(--border)"}`,background:category===cat?`${cfg.color}18`:"var(--surface2)",color:category===cat?cfg.color:"var(--text-muted)",fontSize:"11px",fontWeight:700,letterSpacing:"1px",whiteSpace:"nowrap",textTransform:"uppercase",cursor:"pointer",transition:"all 0.2s",boxShadow:category===cat?`0 0 10px ${cfg.color}22`:"none" }}>
                <span>{cfg.icon}</span>{cat}
                {cfg.bono && (
                  <span style={{ marginLeft:"2px", fontSize:"7px", fontWeight:800, letterSpacing:"0.5px", padding:"2px 5px", borderRadius:"99px", background:"rgba(240,192,64,0.2)", color:"#F0C040" }}>BONO</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Filtro nível */}
        {category !== "Radar Sonoro" && (
          <div style={{ display:"flex",gap:"6px",marginBottom:"16px",alignItems:"center",flexWrap:"wrap" }}>
            {["Todos","Iniciante","Intermediário","Avançado"].map(l=>{
              const cfg = l==="Todos" ? null : getLevelCfg(l);
              const active = level===l;
              return (
                <button key={l} onClick={()=>setLevel(l)} style={{ padding:"5px 12px",borderRadius:"99px",border:`1px solid ${active?(cfg?.color||"var(--gold)"):"var(--border)"}`,background:active?`${cfg?.color||"#D4A017"}14`:"transparent",color:active?(cfg?.color||"var(--gold)"):"var(--text-muted)",fontSize:"10px",fontWeight:700,letterSpacing:"1px",textTransform:"uppercase",cursor:"pointer",transition:"all 0.2s" }}>{l}</button>
              );
            })}
            <span style={{ fontSize:"11px",color:"var(--text-muted)",marginLeft:"4px" }}>
              {loading?"...":`${filtered.length} rutina${filtered.length!==1?"s":""}`}
            </span>
          </div>
        )}

        {category === "Radar Sonoro" ? (
          <RadarSonoroTrainer />
        ) : (
        <>
        {error && <div style={{ marginBottom:"14px",padding:"12px 16px",background:"rgba(192,57,43,0.1)",border:"1px solid rgba(192,57,43,0.4)",borderRadius:"8px",fontSize:"12px",color:"#e57373" }}>{error}</div>}

        {loading ? (
          <div style={{ textAlign:"center",padding:"60px 0" }}>
            <div style={{ fontSize:"32px",marginBottom:"12px" }}>⚡</div>
            <div className="loading-text">Cargando entrenamientos...</div>
          </div>
        ) : filtered.length===0 ? (
          <div style={{ textAlign:"center",padding:"60px 0" }}>
            <div style={{ fontSize:"32px",marginBottom:"12px" }}>🎯</div>
            <div className="loading-text">No hay rutinas en esta categoría.</div>
          </div>
        ) : (
          <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))",gap:"12px" }}>
            {filtered.map((t,i)=><TreinoCard key={t.id} t={t} idx={i} onCopy={handleCopy}/>)}
          </div>
        )}

        {!loading && filtered.length>0 && (
          <div style={{ marginTop:"28px",padding:"14px 16px",background:"var(--surface)",border:"1px solid var(--border)",borderRadius:"10px",fontSize:"11px",color:"var(--text-muted)",lineHeight:1.7 }}>
            <span style={{ color:"var(--gold)",fontWeight:800 }}>💡 Rutina recomendada:</span>{" "}
            Warm-Up (5 min) → Arrastre/Headshot (10 min) → Capa (5 min) → Ranked. Hazlo todos los días por 2 semanas.
          </div>
        )}
        </>
        )}
      </div>
    </div>
  );
}
