/* global process */
import { readFile } from "node:fs/promises";
import { fileURLToPath, pathToFileURL } from "node:url";
import { applicationDefault, initializeApp } from "firebase-admin/app";
import { FieldValue, getFirestore } from "firebase-admin/firestore";
import { legacyId, readLegacyCatalog } from "../src/domain/legacyCatalog.js";

export const TEST_PROJECT_ID = "fullhead---next";
export const TEST_ENVIRONMENT = "next-testing";
export const CATALOGS = Object.freeze(["presets", "huds", "configs", "treinos"]);

function parseArgs(argv) {
  const values = new Map();
  const flags = new Set();
  for (const argument of argv) {
    if (!argument.startsWith("--")) throw new Error(`Argumento no reconocido: ${argument}`);
    const [name, ...rest] = argument.slice(2).split("=");
    if (rest.length) values.set(name, rest.join("="));
    else flags.add(name);
  }
  const known = new Set(["write", "overwrite"]);
  const knownValues = new Set(["confirm-project", "only"]);
  for (const flag of flags) if (!known.has(flag)) throw new Error(`Opción no reconocida: --${flag}`);
  for (const name of values.keys()) if (!knownValues.has(name)) throw new Error(`Opción no reconocida: --${name}`);
  return { flags, values };
}

export function assertTestTarget(env = process.env) {
  if (env.VITE_FULLHEAD_ENV !== TEST_ENVIRONMENT || env.FULLHEAD_ENV !== TEST_ENVIRONMENT) {
    throw new Error(`Importación bloqueada: VITE_FULLHEAD_ENV y FULLHEAD_ENV deben ser ${TEST_ENVIRONMENT}.`);
  }
  if (env.VITE_FIREBASE_PROJECT_ID !== TEST_PROJECT_ID) {
    throw new Error(`Importación bloqueada: el único projectId permitido es ${TEST_PROJECT_ID}.`);
  }
}

export async function createImportPlan({ only } = {}) {
  const selected = only ? [only] : CATALOGS;
  if (selected.some((kind) => !CATALOGS.includes(kind))) {
    throw new Error(`Catálogo desconocido: ${only}. Usa ${CATALOGS.join(", ")}.`);
  }

  const plan = [];
  for (const kind of selected) {
    const url = new URL(`../${kind}.json`, import.meta.url);
    const records = JSON.parse(await readFile(url, "utf8"));
    readLegacyCatalog(kind, records, { file: fileURLToPath(url) });
    for (const record of records) {
      plan.push({ kind, id: legacyId(kind, record), data: structuredClone(record) });
    }
  }
  return plan;
}

export async function runCatalogImport({ argv = process.argv.slice(2), env = process.env } = {}) {
  const { flags, values } = parseArgs(argv);
  assertTestTarget(env);

  const write = flags.has("write");
  const overwrite = flags.has("overwrite");
  if (overwrite && !write) throw new Error("--overwrite solo puede usarse junto con --write.");

  const plan = await createImportPlan({ only: values.get("only") });
  const counts = Object.fromEntries(CATALOGS.map((kind) => [kind, plan.filter((item) => item.kind === kind).length]));
  console.log(`Destino confirmado: ${TEST_PROJECT_ID} (${TEST_ENVIRONMENT})`);
  console.log(`Plan validado: ${JSON.stringify(counts)}; total ${plan.length}.`);

  if (!write) {
    console.log("Simulación concluida. Ningún dato remoto fue escrito.");
    return { mode: "dry-run", counts, total: plan.length };
  }
  if (values.get("confirm-project") !== TEST_PROJECT_ID) {
    throw new Error(`Escritura bloqueada: añade --confirm-project=${TEST_PROJECT_ID}.`);
  }

  const app = initializeApp({ credential: applicationDefault(), projectId: TEST_PROJECT_ID });
  const db = getFirestore(app);
  const batch = db.batch();
  for (const item of plan) {
    const ref = db.collection(item.kind).doc(item.id);
    const data = { ...item.data, updatedAt: FieldValue.serverTimestamp() };
    if (overwrite) batch.set(ref, data);
    else batch.create(ref, data);
  }
  await batch.commit();

  console.log(`${plan.length} documentos importados en una operación atómica.`);
  return { mode: overwrite ? "overwrite" : "create", counts, total: plan.length };
}

const isDirectRun = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isDirectRun) {
  runCatalogImport().catch((error) => {
    console.error(`Importación cancelada: ${error.message}`);
    process.exitCode = 1;
  });
}
