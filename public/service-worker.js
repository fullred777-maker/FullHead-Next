const CACHE_NAME = 'panel-fullhead-v7';
const STATIC_CACHE = 'static-v7';
const DYNAMIC_CACHE = 'dynamic-v7';

const staticAssets = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.svg',
  '/favicon.png',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');
  
  event.waitUntil(
    Promise.all([
      caches.open(STATIC_CACHE).then((cache) => {
        console.log('[Service Worker] Caching static assets');
        return cache.addAll(staticAssets).catch((err) => {
          console.warn('[Service Worker] Error caching static assets:', err);
        });
      }),
      caches.open(CACHE_NAME).then(() => {
        console.log('[Service Worker] Cache storage ready');
      })
    ])
  );
  
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== STATIC_CACHE && 
              cacheName !== DYNAMIC_CACHE && 
              cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  
  self.clients.claim();
});

// Fetch event - network first, cache fallback
self.addEventListener('fetch', (event) => {
  const { request } = event;
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Centro de Conexión: o teste de velocidade não pode passar pelo cache
  // (falsearia a medição e encheria o armazenamento com o arquivo de teste)
  try {
    if (new URL(request.url).hostname === 'speed.cloudflare.com') {
      return;
    }
  } catch { /* URL inválida: segue o fluxo normal */ }
  
  // Never cache API or Firestore responses. They may depend on the signed-in user.
  if (request.url.includes('/api/') || request.url.includes('firestore')) {
    return;
  }
  
  // Para JS e CSS: network first — garante que código atualizado sempre chega
  // (evita o problema de cache stale no iOS PWA)
  if (request.url.includes('.js') || request.url.includes('.css')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (!response || response.status !== 200 || response.type === 'error') {
            return response;
          }
          const responseClone = response.clone();
          caches.open(STATIC_CACHE).then((cache) => cache.put(request, responseClone));
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // Para imagens e outros assets estáticos: cache first (mudam pouco)
  if (request.url.includes('.png') ||
      request.url.includes('.svg') ||
      request.url.includes('.webp') ||
      request.url.includes('favicon')) {
    event.respondWith(
      caches.match(request).then((response) => {
        if (response) return response;
        return fetch(request).then((response) => {
          if (!response || response.status !== 200 || response.type === 'error') return response;
          const responseClone = response.clone();
          caches.open(STATIC_CACHE).then((cache) => cache.put(request, responseClone));
          return response;
        }).catch(() => {
          if (request.destination === 'image') {
            return new Response('<svg></svg>', { headers: { 'Content-Type': 'image/svg+xml' } });
          }
          return caches.match('/');
        });
      })
    );
    return;
  }
  
  // For HTML pages - network first, cache fallback
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (!response || response.status !== 200) {
          return response;
        }
        
        const responseClone = response.clone();
        caches.open(DYNAMIC_CACHE).then((cache) => {
          cache.put(request, responseClone);
        });
        
        return response;
      })
      .catch(() => {
        return caches.match(request).then((response) => {
          return response || caches.match('/');
        });
      })
  );
});

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-presets') {
    event.waitUntil(syncPresets());
  }
});

async function syncPresets() {
  try {
    // Sync any pending changes
    console.log('[Service Worker] Syncing presets...');
    return Promise.resolve();
  } catch (error) {
    console.error('[Service Worker] Sync error:', error);
    throw error;
  }
}

// Handle push notifications
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  const options = {
    body: data.body || 'Panel FullHead',
    icon: '/favicon.png',
    badge: '/favicon.svg',
    theme_color: '#fbbf24',
    tag: 'fullhead-notification',
    requireInteraction: false,
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title || 'Panel FullHead', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clientList) => {
      // Check if app is already open
      for (let client of clientList) {
        if (client.url === '/' && 'focus' in client) {
          return client.focus();
        }
      }
      // Open new window if not open
      if (self.clients.openWindow) {
        return self.clients.openWindow('/');
      }
    })
  );
});

console.log('[Service Worker] Script loaded');
