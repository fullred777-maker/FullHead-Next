import { readFile } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import process from 'node:process';
import { auditCatalogs } from '../src/domain/legacyCatalog.js';

export async function auditLocalFiles(directory = fileURLToPath(new URL('../', import.meta.url))) {
  const entries = await Promise.all(['presets', 'huds', 'configs', 'treinos'].map(async kind => {
    try { return [kind, JSON.parse(await readFile(resolve(directory, `${kind}.json`), 'utf8'))]; }
    catch (error) { throw new Error(`${kind}.json · registro 1 · $: ${error.message}`); }
  }));
  return auditCatalogs(Object.fromEntries(entries));
}

export function assertLegacyBaseline(report) {
  const expected = { presets: 18, huds: 18, configs: 18, treinos: 4 };
  for (const [kind, count] of Object.entries(expected)) {
    if (report.counts[kind] !== count) throw new Error(`${kind}.json · registro catálogo · cantidad: se esperaban ${count}`);
  }
  const checks = [
    [report.sharedDevices === 18, 'catálogos', 'aparelhos compartilhados'],
    [report.brands === 4, 'catálogos', 'marcas'],
    [JSON.stringify(report.profiles) === '["Geral"]', 'catálogos', 'profile'],
    [report.sensitivityVectors === 12, 'presets.json', 'vetores'],
    [report.conflicts.numeric.length === 4, 'huds.json/configs.json', 'faixas'],
    [report.conflicts.textual.length === 1 && report.conflicts.textual[0].device === 'samsung|a32', 'huds.json/configs.json', 'A32'],
    [report.hudsWithoutImage === 18, 'huds.json', 'imageUrl'],
    [JSON.stringify(report.hudFingers) === '[2]', 'huds.json', 'fingers'],
    [report.freeLook.min === 67 && report.freeLook.max === 76, 'presets.json', 'freeLook'],
  ];
  for (const [ok, file, field] of checks) if (!ok) throw new Error(`${file} · registro catálogo · ${field}: invariante legado alterado`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    const report = await auditLocalFiles(process.argv[2]);
    assertLegacyBaseline(report);
    console.log(JSON.stringify(report, null, 2));
    console.log('Auditoria M1: invariantes confirmados; conflitos continuam pendentes. Somente arquivos locais.');
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
