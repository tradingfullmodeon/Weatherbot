// Service worker de Talkride: guarda la app para usarla sin conexión.
// Archivos propios: red primero y copia en caché como respaldo (así nunca se queda una versión vieja).
// La API del coach IA no se guarda nunca en caché.
const CACHE = 'talkride-v22';
const SHELL = ['./', 'index.html', 'evaluar.html', 'roleplay.html', 'gimnasio.html', 'escritura.html', 'aprender.html', 'evento.html', 'progreso.html', 'diagnostico.html',
  'voxa.css', 'shared.js', 'scenarios.js', 'plan.js', 'devices.js', 'lessons.js', 'writing.js', 'events.js', 'goals.js', 'audiofile.js', 'structure.js', 'feedback.js', 'reminder.js', 'help.js', 'interview.js', 'plan-pro.js', 'memory.js', 'foryou.js', 'share.js', 'lang.js', 'charts.js', 'presence.js', 'method.js', 'metodo.html', 'prueba.html', 'feedback.js', 'levels.js', 'fonts/source-serif-4.woff2', 'pro.html', 'privacidad.html', 'terminos.html', 'manifest.webmanifest', 'icon.svg', 'icon-192.png', 'icon-512.png', 'icon-maskable-512.png', 'apple-touch-icon.png'];

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
      // ignoreVary: el servidor marca los archivos con «Vary: Origin» y los módulos JS se piden con Origin; sin esto,
      // sin conexión no se encontraría ninguna copia guardada.
      .catch(() => caches.match(e.request, { ignoreSearch: true, ignoreVary: true }))
  );
});
