import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

test('v7 service worker leaves authenticated API and Firestore requests to the network', async () => {
  const source = await readFile(new URL('../public/service-worker.js', import.meta.url), 'utf8');
  const listeners = new Map();
  const deleted = [];
  const context = {
    self: {
      addEventListener: (name, handler) => listeners.set(name, handler),
      clients: { claim() {} },
    },
    caches: {
      keys: async () => ['panel-fullhead-v6', 'static-v6', 'dynamic-v6', 'panel-fullhead-v7', 'static-v7', 'dynamic-v7'],
      delete: async key => { deleted.push(key); return true; },
    },
    console: { log() {}, warn() {}, error() {} },
    URL,
  };
  vm.runInNewContext(source, context);
  assert.match(source, /panel-fullhead-v7/);
  assert.match(source, /static-v7/);
  assert.match(source, /dynamic-v7/);
  let activation;
  listeners.get('activate')({ waitUntil(promise) { activation = promise; } });
  await activation;
  assert.deepEqual(deleted.sort(), ['dynamic-v6', 'panel-fullhead-v6', 'static-v6']);

  for (const url of ['https://firestore.googleapis.com/v1/projects/fullhead---next/databases/(default)/documents/presets', 'https://full-head-next.vercel.app/api/example']) {
    let intercepted = false;
    listeners.get('fetch')({
      request: { method: 'GET', url },
      respondWith() { intercepted = true; },
    });
    assert.equal(intercepted, false, `${url} should not be cached by the service worker`);
  }
});
