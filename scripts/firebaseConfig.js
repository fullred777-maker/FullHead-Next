const PRODUCTION_FIREBASE_PROJECT_ID = "panelfreefire-f90aa";

const envNames = {
  apiKey: "VITE_FIREBASE_API_KEY",
  authDomain: "VITE_FIREBASE_AUTH_DOMAIN",
  projectId: "VITE_FIREBASE_PROJECT_ID",
  storageBucket: "VITE_FIREBASE_STORAGE_BUCKET",
  messagingSenderId: "VITE_FIREBASE_MESSAGING_SENDER_ID",
  appId: "VITE_FIREBASE_APP_ID",
  measurementId: "VITE_FIREBASE_MEASUREMENT_ID",
};

export function getTestFirebaseConfig(env = process.env) {
  if (env.VITE_FULLHEAD_ENV !== "next-testing") {
    throw new Error("VITE_FULLHEAD_ENV debe ser next-testing para ejecutar importaciones.");
  }

  const config = Object.fromEntries(
    Object.entries(envNames).map(([key, name]) => [key, env[name] || undefined])
  );
  const missing = Object.entries(envNames)
    .filter(([key]) => key !== "measurementId" && !config[key])
    .map(([, name]) => name);

  if (missing.length > 0) {
    throw new Error(`Configuración Firebase incompleta: ${missing.join(", ")}`);
  }
  if (config.projectId === PRODUCTION_FIREBASE_PROJECT_ID || config.projectId !== "fullhead---next") {
    throw new Error("Importación bloqueada: Firebase de produção detectado.");
  }
  if (
    !config.authDomain.startsWith(`${config.projectId}.`) ||
    !config.storageBucket.startsWith(`${config.projectId}.`) ||
    !config.appId.startsWith(`1:${config.messagingSenderId}:web:`)
  ) {
    throw new Error("Configuração Firebase inconsistente.");
  }

  return config;
}
