import { Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import Register from "./pages/Register.jsx";
import Login from "./pages/Login.jsx";
import ForgotPassword from "./pages/ForgotPassword.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth, messaging } from "./firebase";
const RecommendationsV1 = lazy(() => import("./components/RecommendationsV1.jsx"));
import Treinos from "./pages/Treinos.jsx";
import CalibradorLive from "./pages/CalibradorLive.jsx";
import GeneradorNicks from "./pages/GeneradorNicks.jsx";
import CentroConexion from "./pages/CentroConexion.jsx";
import CreatorHub from "./pages/CreatorHub.jsx";
import Modulo1Oficial from "./pages/creator/Modulo1Oficial.jsx";
import Modulo2Contenido from "./pages/creator/Modulo2Contenido.jsx";
import Modulo3Monetizacion from "./pages/creator/Modulo3Monetizacion.jsx";
import Modulo4Retos from "./pages/creator/Modulo4Retos.jsx";
import Modulo5Canal from "./pages/creator/Modulo5Canal.jsx";
import Instalacion from "./pages/Instalacion.jsx";
import AppLayout from "./components/AppLayout.jsx";
import { inicializarNotificaciones } from "./utils/notifications.js";
import Tutorial from "./pages/Tutorial.jsx";
import { PlayerProfileProvider } from "./context/PlayerProfileContext.jsx";
import { requiresInstalledApp } from "./domain/accessPolicy.js";

// ─── Reset PWA via ?resetpwa na URL ──────────────────────
if (typeof window !== "undefined" && new URLSearchParams(window.location.search).has("resetpwa")) {
  ["fh_is_pwa", "fh_tutorial_done"].forEach((k) => localStorage.removeItem(k));
  sessionStorage.removeItem("fh_session_started");
  window.location.replace(window.location.pathname);
}

// ─── Hook PWA (apenas tutorial redirect) ─────────────────
function usePWA() {
  const [isStandalone] = useState(() => {
    const ios = "standalone" in window.navigator && window.navigator.standalone === true;
    const android =
      window.matchMedia("(display-mode: standalone)").matches ||
      window.matchMedia("(display-mode: fullscreen)").matches;
    const result = ios || android;
    if (result) localStorage.setItem("fh_is_pwa", "true");
    return result;
  });

  const [tutorialDone, setTutorialDone] = useState(
    () => !!localStorage.getItem("fh_tutorial_done")
  );

  const completeTutorial = () => {
    localStorage.setItem("fh_tutorial_done", "true");
    setTutorialDone(true);
  };

  return { isStandalone, tutorialDone, completeTutorial };
}

// ─── Rota protegida ──────────────────────────────────────
function ProtectedRoute({ children }) {
  const [user, setUser] = useState(undefined);
  const notifInicializadas = useRef(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u || null);
      if (u && !notifInicializadas.current) {
        notifInicializadas.current = true;
        // Só dispara sozinho se a permissão JÁ foi concedida antes (não exige
        // gesto do usuário nesse caso). Se ainda estiver "default", o Chrome
        // bloqueia silenciosamente um pedido automático — por isso deixamos
        // pro botão "Activar Notificaciones" no Dashboard, que é um toque real.
        if (typeof Notification !== "undefined" && Notification.permission === "granted") {
          inicializarNotificaciones(u.uid, messaging);
        }
      }
    });
    return () => unsub();
  }, []);

  if (user === undefined) {
    return (
      <div style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--black)",
        fontFamily: "'Inter', sans-serif",
        fontSize: "13px",
        color: "var(--text-muted)",
        letterSpacing: "2px",
      }}>
        Cargando...
      </div>
    );
  }

  if (!user) return <Navigate to="/registro" />;
  return <PlayerProfileProvider key={user.uid} userId={user.uid}><AppLayout>{children}</AppLayout></PlayerProfileProvider>;
}

// ─── Controlador de fluxo ─────────────────────────────────
function PWAController({ children }) {
  const { isStandalone, tutorialDone } = usePWA();
  const navigate = useNavigate();
  const location = useLocation();
  const installationRequired = requiresInstalledApp(import.meta.env.VITE_FULLHEAD_ENV);

  const publicRoutes = ["/login", "/registro", "/esqueci-senha", "/tutorial"];
  const isPublicRoute = publicRoutes.includes(location.pathname);

  // Esconde o splash HTML nativo quando o React estiver montado e pronto
  useEffect(() => {
    if (typeof window.__hideSplash === "function") {
      // Aguarda ao menos 4.3s da animação antes de esconder
      const elapsed = Date.now() - (window.__splashStart || Date.now());
      const remaining = Math.max(0, 4300 - elapsed);
      const t = setTimeout(() => window.__hideSplash(), remaining);
      return () => clearTimeout(t);
    }
  }, []);

  // Redireciona para tutorial quando aberto no navegador pela 1ª vez
  useEffect(() => {
    if (installationRequired && !isStandalone && !tutorialDone && !isPublicRoute) {
      navigate("/tutorial", { replace: true });
    }
  }, [installationRequired, isStandalone, tutorialDone, isPublicRoute, navigate]);

  return children;
}

// ─── App principal ───────────────────────────────────────
export default function App() {
  return (
    <PWAController>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/registro" element={<Register />} />
        <Route path="/esqueci-senha" element={<ForgotPassword />} />
        <Route path="/tutorial" element={<Tutorial />} />
        <Route
          path="/instalacion"
          element={<ProtectedRoute><Instalacion /></ProtectedRoute>}
        />
        <Route
          path="/sensi"
          element={<ProtectedRoute><Suspense fallback={<p role="status">Carregando catálogo V1...</p>}><RecommendationsV1 mode="sensibilidade" /></Suspense></ProtectedRoute>}
        />
        <Route
          path="/hud"
          element={<ProtectedRoute><Suspense fallback={<p role="status">Carregando catálogo V1...</p>}><RecommendationsV1 mode="hud" /></Suspense></ProtectedRoute>}
        />
        <Route
          path="/configs"
          element={<ProtectedRoute><Suspense fallback={<p role="status">Carregando catálogo V1...</p>}><RecommendationsV1 mode="config" /></Suspense></ProtectedRoute>}
        />
        <Route
          path="/treinos"
          element={<ProtectedRoute><Treinos /></ProtectedRoute>}
        />
        <Route
          path="/calibrador"
          element={<ProtectedRoute><CalibradorLive /></ProtectedRoute>}
        />
        <Route
          path="/nicks"
          element={<ProtectedRoute><GeneradorNicks /></ProtectedRoute>}
        />
        <Route
          path="/conexion"
          element={<ProtectedRoute><CentroConexion /></ProtectedRoute>}
        />
        <Route path="/creator" element={<ProtectedRoute><CreatorHub /></ProtectedRoute>} />
        <Route path="/creator/oficial" element={<ProtectedRoute><Modulo1Oficial /></ProtectedRoute>} />
        <Route path="/creator/contenido" element={<ProtectedRoute><Modulo2Contenido /></ProtectedRoute>} />
        <Route path="/creator/monetizacion" element={<ProtectedRoute><Modulo3Monetizacion /></ProtectedRoute>} />
        <Route path="/creator/retos" element={<ProtectedRoute><Modulo4Retos /></ProtectedRoute>} />
        <Route path="/creator/canal" element={<ProtectedRoute><Modulo5Canal /></ProtectedRoute>} />
        <Route
          path="/"
          element={<ProtectedRoute><Dashboard /></ProtectedRoute>}
        />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </PWAController>
  );
}
