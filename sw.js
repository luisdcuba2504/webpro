// Service worker de BuilderWeb Pro — mínimo y seguro.
//
// Estrategia: RED PRIMERO (network-first) para todo lo del mismo origen.
// - El HTML de las páginas NUNCA se cachea: siempre se pide a la red, así la
//   web jamás queda «congelada» en una versión vieja tras publicar cambios.
// - Solo se guarda copia de respaldo de estáticos (css, js, imágenes,
//   iconos y el manifiesto) que hayan respondido 200, para que la app
//   instalada abra aunque falle la conexión.
// - No intercepta: métodos distintos de GET (formularios), otros orígenes,
//   ni rutas /api.
const CACHE = 'bwp-static-v1';
const STATIC_RE = /\.(?:css|js|png|jpg|jpeg|gif|svg|webp|ico|woff2?|ttf|webmanifest)$/i;

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/api')) return;

  event.respondWith((async () => {
    try {
      const res = await fetch(req);
      if (res.status === 200 && STATIC_RE.test(url.pathname)) {
        const cache = await caches.open(CACHE);
        cache.put(req, res.clone());
      }
      return res;
    } catch (err) {
      const cached = await caches.match(req);
      if (cached) return cached;
      throw err;
    }
  })());
});
