import { initializeApp } from "firebase/app";
import { getAnalytics, isSupported as isAnalyticsSupported } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getMessaging, isSupported } from "firebase/messaging";

const PRODUCTION_FIREBASE_PROJECT_ID = "panelfreefire-f90aa";

const requiredFirebaseEnv = {
  apiKey: "VITE_FIREBASE_API_KEY",
  authDomain: "VITE_FIREBASE_AUTH_DOMAIN",
  projectId: "VITE_FIREBASE_PROJECT_ID",
  storageBucket: "VITE_FIREBASE_STORAGE_BUCKET",
  messagingSenderId: "VITE_FIREBASE_MESSAGING_SENDER_ID",
  appId: "VITE_FIREBASE_APP_ID",
};

const missingFirebaseEnv = Object.values(requiredFirebaseEnv).filter(
  (name) => !import.meta.env[name]
);

if (import.meta.env.VITE_FULLHEAD_ENV !== "next-testing") {
  throw new Error("Entorno bloqueado: VITE_FULLHEAD_ENV debe ser next-testing.");
}

if (missingFirebaseEnv.length > 0) {
  throw new Error(`Configuración Firebase incompleta: ${missingFirebaseEnv.join(", ")}`);
}

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || undefined,
};

if (firebaseConfig.projectId === PRODUCTION_FIREBASE_PROJECT_ID || firebaseConfig.projectId !== "fullhead---next") {
  throw new Error("Conexión bloqueada: este repositorio no puede usar el Firebase de producción.");
}

if (
  !firebaseConfig.authDomain.startsWith(`${firebaseConfig.projectId}.`) ||
  !firebaseConfig.storageBucket.startsWith(`${firebaseConfig.projectId}.`) ||
  !firebaseConfig.appId.startsWith(`1:${firebaseConfig.messagingSenderId}:web:`)
) {
  throw new Error("Configuración Firebase inconsistente entre proyecto, dominio, bucket y app.");
}

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

export let analytics = null;
isAnalyticsSupported().then((supported) => {
  if (supported && firebaseConfig.measurementId) {
    analytics = getAnalytics(app);
  }
});

export let messaging = null;
isSupported().then((supported) => {
  if (supported) {
    messaging = getMessaging(app);
  }
});

export { app };
