/* global process */
import { readFile, realpath } from 'node:fs/promises';
import { Buffer } from 'node:buffer';
import { relative, isAbsolute } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { assertCatalog, V1_COLLECTION } from '../src/domain/recommendationsV1.js';

export function assertV1Target(env) {
  if (env.VITE_FIREBASE_PROJECT_ID !== 'fullhead---next' || env.VITE_FULLHEAD_ENV !== 'next-testing' || env.FULLHEAD_ENV !== 'next-testing') throw Error('Destino V1 bloqueado: apenas fullhead---next / next-testing.');
  for (const key of ['GOOGLE_CLOUD_PROJECT', 'GCLOUD_PROJECT']) if (env[key] && env[key] !== 'fullhead---next') throw Error('Projeto administrativo divergente.');
  if (env.FIRESTORE_EMULATOR_HOST) throw Error('Importador de testes remoto não aceita redirecionamento por emulador.');
}
export function assertV1Credential(key) {
  if (key.type !== 'service_account' || key.project_id !== 'fullhead---next' || !key.client_email?.endsWith('@fullhead---next.iam.gserviceaccount.com')) throw Error('Credencial deve pertencer exclusivamente ao projeto fullhead---next.');
}
export async function createV1Plan() {
  const release = JSON.parse(await readFile(new URL('../src/data/recommendations-v1.json', import.meta.url), 'utf8'));
  assertCatalog(release.devices);
  if (!/^[a-f0-9]{64}$/.test(release.sourceHash) || release.devices.some(d => d.sourceHash !== release.sourceHash)) throw Error('Hash de origem divergente.');
  const plan = release.devices.map(data => ({ id: data.id, collection: V1_COLLECTION, data }));
  // Conservative limits below Firestore document/request limits; never split an atomic release.
  if (plan.some(p => Buffer.byteLength(JSON.stringify(p.data)) > 800000) || Buffer.byteLength(JSON.stringify(plan)) > 8000000) throw Error('Pacote excede limite conservador de escrita atômica.');
  return plan;
}
export async function commitV1Plan(db, plan) {
  assertCatalog(plan.map(p => p.data));
  if (plan.some(p => p.collection !== V1_COLLECTION || p.id !== p.data.id)) throw Error('Coleção ou identidade divergente.');
  const batch = db.batch();
  for (const p of plan) batch.create(db.collection(V1_COLLECTION).doc(p.id), p.data);
  await batch.commit(); // create-only: an existing document aborts the whole batch.
}
export async function runV1Import({ argv = process.argv.slice(2), env = process.env } = {}) {
  assertV1Target(env);
  for (const arg of argv) if (!['--dry-run','--write','--confirm-project=fullhead---next'].includes(arg)) throw Error('Argumento de importação desconhecido.');
  if (argv.includes('--write') && argv.includes('--dry-run')) throw Error('Escolha dry-run ou escrita.');
  const plan = await createV1Plan();
  const summary = { collection: V1_COLLECTION, devices: plan.length, options: plan.reduce((n,p) => n+p.data.options.length,0) };
  if (!argv.includes('--write')) return { mode: 'dry-run', ...summary, written: 0 };
  if (!argv.includes('--confirm-project=fullhead---next')) throw Error('Escrita exige --confirm-project=fullhead---next.');
  if (!env.GOOGLE_APPLICATION_CREDENTIALS) throw Error('Credencial administrativa de testes não configurada; nenhuma escrita realizada.');
  const credentialPath = await realpath(env.GOOGLE_APPLICATION_CREDENTIALS);
  const repo = await realpath(fileURLToPath(new URL('../', import.meta.url)));
  const rel = relative(repo, credentialPath);
  if (!rel.startsWith('..') && !isAbsolute(rel)) throw Error('Mantenha a credencial fora do repositório.');
  const key = JSON.parse(await readFile(credentialPath, 'utf8'));
  assertV1Credential(key);
  const { initializeApp, cert, deleteApp } = await import('firebase-admin/app');
  const { getFirestore } = await import('firebase-admin/firestore');
  const app = initializeApp({ projectId: 'fullhead---next', credential: cert(key) }, 'fullhead-v1-import');
  try {
    const db = getFirestore(app);
    await commitV1Plan(db, plan);
    return { mode: 'write', ...summary, written: plan.length };
  } finally { await deleteApp(app); }
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  runV1Import().then(result => console.log(JSON.stringify(result))).catch(error => {
    console.error('Importação V1 cancelada:', error.code || error.message);
    process.exitCode = 1;
  });
}
