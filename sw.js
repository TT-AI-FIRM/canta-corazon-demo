/* Canta Corazón · Demo · memoria sin internet (service worker).
   Al abrir cualquier página del demo con internet se guarda TODO en el dispositivo: portada, app del
   cliente, sistema interno, tipografías, fotos y librerías. Sin red, todo sigue funcionando.
   Páginas, JS y CSS: primero la red (con 3 s de espera máxima) y, si no hay, la copia guardada.
   Imágenes, tipografías y librerías: primero la copia guardada (no cambian).
   Al publicar cambios, subir VERSION para que el navegador tome el paquete nuevo. */
const VERSION = 'cc-demo-v11';
const ARCHIVOS = [
  './', 'index.html',
  'cliente/', 'cliente/index.html', 'cliente/cliente.css', 'cliente/app.js', 'cliente/promos.js', 'cliente/entrar.js', 'cliente/manifest.webmanifest',
  'interno/', 'interno/index.html', 'interno/interno.css', 'interno/app.js', 'interno/puerta.js', 'interno/promos.js', 'interno/manifest.webmanifest',
  'shared/brand.css', 'shared/core.js', 'shared/sync.js',
  'shared/vendor/qrcode.min.js', 'shared/vendor/jsQR.min.js', 'shared/vendor/chart.umd.min.js',
  'shared/fonts/Montserrat.woff2', 'shared/fonts/Montserrat-Italic.woff2', 'shared/fonts/InterTight.woff2',
  'shared/img/logo.png', 'shared/img/logo_cream.png', 'shared/img/logo_dark.png', 'shared/img/logo_white.png', 'shared/img/fav.svg',
  'shared/img/apple-touch-icon.png', 'shared/img/icon-192.png', 'shared/img/icon-512.png', 'shared/img/meta.jpg',
  'shared/img/carr1.webp', 'shared/img/ccww.webp', 'shared/img/bloque1.webp',
  'shared/img/post_noche.webp', 'shared/img/post_sombrero.webp', 'shared/img/post_fachada.webp', 'shared/img/post_frase.webp',
  'shared/img/shots/shot_cl_noche.webp', 'shared/img/shots/shot_cl_reservar.webp', 'shared/img/shots/shot_mesas.webp', 'shared/img/shots/shot_tablero.webp', 'shared/img/shots/shot_barra.webp'
];

self.addEventListener('install', (e) => {
  self.skipWaiting();
  // uno por uno: si un archivo falla, los demás sí se guardan
  e.waitUntil(caches.open(VERSION).then((c) => Promise.all(ARCHIVOS.map((a) => c.add(new Request(a, { cache: 'reload' })).catch(() => null)))));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k.startsWith('cc-demo') && k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});

function guardar(req, res) { if (res && res.ok && res.type === 'basic') { const copia = res.clone(); caches.open(VERSION).then((c) => c.put(req, copia)); } return res; }
function conEspera(promesa, ms) { return new Promise((ok, no) => { const t = setTimeout(() => no(new Error('lento')), ms); promesa.then((r) => { clearTimeout(t); ok(r); }, (e) => { clearTimeout(t); no(e); }); }); }

self.addEventListener('fetch', (e) => {
  const req = e.request; const url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== location.origin) return;
  const fijo = /\.(png|jpe?g|webp|svg|woff2)$/.test(url.pathname) || url.pathname.includes('/vendor/');
  if (fijo) { e.respondWith(caches.match(req, { ignoreSearch: true }).then((hit) => hit || fetch(req).then((r) => guardar(req, r)))); return; }
  // sin red: la copia guardada, sin importar ?rol=…, ?user=… ni ?v=… (cada versión del demo tiene su propia memoria)
  const deGuardado = () => caches.match(req, { ignoreSearch: true }).then((hit) => hit || (req.mode === 'navigate' ? caches.match(new URL('index.html', url).href) : undefined)).then((hit) => hit || Response.error());
  e.respondWith(conEspera(fetch(req), 3000).then((r) => guardar(req, r)).catch(deGuardado));
});
