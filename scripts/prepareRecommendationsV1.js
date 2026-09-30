/* global process */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { adaptRecommendationsV1 } from './adaptRecommendationsV1.js';
const args = process.argv.slice(2);
if (args.length !== 1 || !args[0].startsWith('--source=')) throw Error('Informe --source=caminho-do-JSON-V1.');
const bytes = await readFile(args[0].slice('--source='.length));
const sourceHash = createHash('sha256').update(bytes).digest('hex');
const devices = adaptRecommendationsV1(JSON.parse(bytes), sourceHash);
await mkdir(new URL('../src/data/', import.meta.url), { recursive: true });
await writeFile(new URL('../src/data/recommendations-v1.json', import.meta.url), JSON.stringify({ sourceHash, devices }, null, 2)+'\n');
console.log(JSON.stringify({ devices: devices.length, options: devices.reduce((n,d) => n+d.options.length,0), sourceHash }));
