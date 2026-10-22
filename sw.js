const CACHE = 'clinic-voice-cards-v7';
const ASSETS = ['./', './index.html', './styles.css?v=7', './app.js?v=7', './icon.svg', './apple-touch-icon.png', './icon-512.png', './manifest.webmanifest',
  '01-results', '02-cancer', '03-fracture', '04-flu-a', '05-blood', '06-iv', '07-test', '08-unwell', '09-pain', '10-breath', '11-inflammation',
  '12-xray-no-fracture', '13-xray-normal', '14-introduction', '15-im-injection', '16-questions', '17-oral-meds', '18-suture', '19-keep-dry', '20-tetanus',
  '21-ecg', '22-ct-consent', '23-xray', '24-normal-results'
].map(path => path.startsWith('./') ? path : './audio/' + path + '.mp3');
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS.map(path => new Request(path, { cache: 'reload' })))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith('clinic-voice-cards-') && key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener('message', event => {
  if (event.data === 'check-offline-ready') event.source?.postMessage({ cache: CACHE });
});
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET' || new URL(event.request.url).origin !== self.location.origin) return;
  if (event.request.mode === 'navigate') {
    event.respondWith(fetch(event.request, { cache: 'no-cache' }).catch(() => caches.open(CACHE).then(cache => cache.match('./index.html'))));
    return;
  }
  event.respondWith(caches.match(event.request).then(async response => {
    if (!response) return fetch(event.request);
    const range = event.request.headers.get('range');
    if (!range || !event.request.url.endsWith('.mp3')) return response;
    const bytes = await response.arrayBuffer();
    const match = /^bytes=(\d*)-(\d*)$/.exec(range);
    if (!match) return new Response(null, { status: 416, headers: { 'Content-Range': 'bytes */' + bytes.byteLength } });
    const start = match[1] ? Number(match[1]) : Math.max(0, bytes.byteLength - Number(match[2]));
    const end = match[1] && match[2] ? Math.min(Number(match[2]), bytes.byteLength - 1) : bytes.byteLength - 1;
    if (start > end || start >= bytes.byteLength) return new Response(null, { status: 416, headers: { 'Content-Range': 'bytes */' + bytes.byteLength } });
    return new Response(bytes.slice(start, end + 1), { status: 206, headers: { 'Content-Type': 'audio/mpeg', 'Accept-Ranges': 'bytes', 'Content-Range': `bytes ${start}-${end}/${bytes.byteLength}`, 'Content-Length': String(end - start + 1) } });
  }));
});
