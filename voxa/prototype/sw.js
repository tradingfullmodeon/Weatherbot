// Service worker de VOXA: guarda la app para usarla sin conexión.
// Archivos propios: red primero y copia en caché como respaldo (así nunca se queda una versión vieja).
// La API del coach IA no se guarda nunca en caché.
const CACHE = 'voxa-v10';
const SHELL = ['./', 'index.html', 'evaluar.html', 'roleplay.html', 'gimnasio.html', 'escritura.html', 'aprender.html', 'evento.html', 'progreso.html', 'diagnostico.html',
  'voxa.css', 'shared.js', 'scenarios.js', 'plan.js', 'devices.js', 'lessons.js', 'writing.js', 'events.js', 'goals.js', 'audiofile.js', 'manifest.webmanifest', 'icon.svg'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin || url.pathname.includes('/api/')) return;
  e.respondWith(
    fetch(e.request)
      .then(res => {
        if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); }
        return res;
      })
      .catch(() => caches.match(e.request, { ignoreSearch: true }))
  );
});
