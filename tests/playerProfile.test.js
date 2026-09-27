import test from 'node:test';
import assert from 'node:assert/strict';
import { Buffer } from 'node:buffer';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { build } from 'esbuild';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import {
  emptyPlayerProfile, loadPlayerProfile, normalizePlayerProfile,
  playerProfileKey, savePlayerProfile,
} from '../src/domain/playerProfile.js';

function memoryStorage() {
  const values = new Map();
  return {
    getItem: key => values.has(key) ? values.get(key) : null,
    setItem: (key, value) => { values.set(key, value); },
    removeItem: key => { values.delete(key); },
  };
}

test('local profile starts unknown, persists every field, and stays scoped to the account', () => {
  const storage = memoryStorage();
  assert.deepEqual(loadPlayerProfile(storage, 'player-1'), emptyPlayerProfile());
  const profile = {
    brand: ' Samsung ', model: ' Galaxy A15 ', variant: ' 4G ',
    fingers: 3, objective: ' Mejorar  precisión ', gameVersion: ' OB50 ',
  };
  const saved = savePlayerProfile(storage, 'player-1', profile);
  assert.deepEqual(saved, {
    brand: 'Samsung', model: 'Galaxy A15', variant: '4G',
    fingers: 3, objective: 'Mejorar precisión', gameVersion: 'OB50',
  });
  assert.deepEqual(loadPlayerProfile(storage, 'player-1'), saved);
  assert.deepEqual(loadPlayerProfile(storage, 'player-2'), emptyPlayerProfile());
  assert.notEqual(playerProfileKey('player-1'), playerProfileKey('player-2'));
});

test('missing and blank fields remain explicitly unknown, without guessed device details', () => {
  const storage = memoryStorage();
  const saved = savePlayerProfile(storage, 'player-1', { brand: '  ', model: 'Moto G54' });
  assert.deepEqual(saved, { ...emptyPlayerProfile(), model: 'Moto G54' });
  assert.deepEqual(loadPlayerProfile(storage, 'player-1'), saved);
  assert.equal(normalizePlayerProfile({ gameVersion: '' }).gameVersion, null);
});

test('unknown fields, invalid values, and future schemas are rejected without overwriting local data', () => {
  const storage = memoryStorage();
  const baseline = savePlayerProfile(storage, 'player-1', { model: 'A15' });
  const original = storage.getItem(playerProfileKey('player-1'));
  assert.throws(() => savePlayerProfile(storage, 'player-1', { ...baseline, dpi: 500 }), /desconocido/);
  assert.throws(() => savePlayerProfile(storage, 'player-1', { ...baseline, fingers: 5 }), /2, 3 o 4/);
  assert.throws(() => savePlayerProfile(storage, 'player-1', { ...baseline, brand: 123 }), /debe ser texto/);
  assert.equal(storage.getItem(playerProfileKey('player-1')), original);

  storage.setItem(playerProfileKey('player-1'), JSON.stringify({ schemaVersion: 2, profile: baseline }));
  assert.throws(() => loadPlayerProfile(storage, 'player-1'), /Versión de perfil local desconocida/);
  storage.setItem(playerProfileKey('player-1'), '{invalid');
  assert.throws(() => loadPlayerProfile(storage, 'player-1'), SyntaxError);
  assert.equal(storage.getItem(playerProfileKey('player-1')), '{invalid');
});

const require = createRequire(import.meta.url);
// Compile the actual three pages in memory. Firebase imports throw if called.
const bundle = await build({
  stdin: {
    contents: 'export { default as Sensi } from "./src/pages/Sensi.jsx"; export { default as Hud } from "./src/pages/Hud.jsx"; export { default as Configs } from "./src/pages/Configs.jsx"; export { PlayerProfileProvider } from "./src/context/PlayerProfileContext.jsx";',
    resolveDir: fileURLToPath(new URL('../', import.meta.url)),
  },
  bundle: true, write: false, format: 'esm', platform: 'node', jsx: 'automatic',
  plugins: [{ name: 'offline-only', setup(builder) {
    builder.onResolve({ filter: /^react(?:-dom|-router-dom)?(?:\/|$)/ }, args => ({ path: pathToFileURL(require.resolve(args.path)).href, external: true }));
    builder.onResolve({ filter: /(?:^firebase\/|\/firebase(?:\.js)?$)/ }, () => ({ path: 'firebase', namespace: 'mock' }));
    builder.onLoad({ filter: /.*/, namespace: 'mock' }, () => ({ contents: 'export const db = {}; export const collection = () => { throw Error("Remote access prohibited in M2 tests"); }; export const getDocs = collection;' }));
  } }],
});
const ui = await import('data:text/javascript;base64,' + Buffer.from(bundle.outputFiles[0].text).toString('base64'));

function renderPage(page, storage) {
  const priorWindow = globalThis.window;
  globalThis.window = { localStorage: storage };
  try {
    return renderToStaticMarkup(
      React.createElement(MemoryRouter, null,
        React.createElement(ui.PlayerProfileProvider, { userId: 'player-1' }, React.createElement(page))),
    );
  } finally {
    if (priorWindow === undefined) delete globalThis.window;
    else globalThis.window = priorWindow;
  }
}

test('each module shows the same editable active profile after a simulated page reload', () => {
  const storage = memoryStorage();
  for (const page of [ui.Sensi, ui.Hud, ui.Configs]) {
    const html = renderPage(page, storage);
    assert.match(html, /Perfil activo/);
    assert.match(html, /Editar perfil/);
    assert.match(html, /Desconocido/);
  }

  savePlayerProfile(storage, 'player-1', {
    brand: 'Motorola', model: 'Moto G54', variant: '5G',
    fingers: 4, objective: 'Control', gameVersion: 'OB50',
  });
  // Each fresh provider reads the persisted profile, as it would on a reload/navigation.
  for (const page of [ui.Sensi, ui.Hud, ui.Configs]) {
    const html = renderPage(page, storage);
    assert.match(html, /Motorola/);
    assert.match(html, /Moto G54/);
    assert.match(html, /5G/);
    assert.match(html, /4 dedos/);
    assert.match(html, /Control/);
    assert.match(html, /OB50/);
  }
});
