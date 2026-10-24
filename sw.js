const CACHE = 'clinic-voice-cards-v14';
const NEURAL_CACHE = 'clinic-voice-cards-neural-v1';
const ASSETS = ['./', './index.html', './styles.css?v=14', './app.js?v=14', './icon.svg', './apple-touch-icon.png', './icon-512.png', './manifest.webmanifest',
  './local-tts-worker.js', './vendor/spellophone/dist/browser.js', './vendor/spellophone/dist/core-w4y-vCu9.js', './vendor/spellophone/wasm/espeak-ng.js', './vendor/spellophone/wasm/espeak-ng.wasm', './vendor/spellophone/espeak-ng-data/manifest.json', './vendor/spellophone/espeak-ng-data/core.bin', './vendor/spellophone/espeak-ng-data/en_dict', './vendor/spellophone/espeak-ng-data/cmn_dict',
  './neural-tts-worker.js',
  '01-results', '02-cancer', '03-fracture', '04-flu-a', '05-blood', '06-iv', '07-test', '08-unwell', '09-pain', '10-breath', '11-inflammation',
  '12-xray-no-fracture', '13-xray-normal', '14-introduction', '15-im-injection', '16-questions', '17-oral-meds', '18-suture', '19-keep-dry', '20-tetanus',
  '21-ecg', '22-ct-consent', '23-xray', '24-normal-results'
].map(path => path.startsWith('./') ? path : './audio/' + path + '.mp3');
const NEURAL_ASSETS = ['./vendor/opencc-js/t2cn.js', './vendor/sherpa-onnx/sherpa-onnx-wasm-main-tts.js', './vendor/sherpa-onnx/sherpa-onnx-tts.js', './vendor/sherpa-onnx/sherpa-onnx-wasm-main-tts.wasm',
  ...['zh_CN-chaowen-medium.onnx', 'tokens.txt', 'lexicon.txt', 'phone.fst', 'date.fst', 'number.fst'].map(name => './models/vits-piper-zh_CN-chaowen-medium-int8/' + name)];
const neuralWrites = new Set();
const isNeuralAsset = url => /\/(?:vendor\/(?:sherpa-onnx|opencc-js)|models\/vits-piper-zh_CN-chaowen-medium-int8)\//.test(new URL(url).pathname);
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS.map(path => new Request(path, { cache: 'reload' })))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith('clinic-voice-cards-') && key !== CACHE && key !== NEURAL_CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener('message', event => {
  if (event.data !== 'check-offline-ready') return;
  event.waitUntil(Promise.all(neuralWrites).then(() => caches.open(NEURAL_CACHE)).then(cache => Promise.all(NEURAL_ASSETS.map(path => cache.match(path))))
    .then(matches => event.source?.postMessage({ cache: CACHE, neural: matches.every(Boolean) })));
});
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET' || new URL(event.request.url).origin !== self.location.origin) return;
  if (event.request.mode === 'navigate') {
    event.respondWith(fetch(event.request, { cache: 'no-cache' }).catch(() => caches.open(CACHE).then(cache => cache.match('./index.html'))));
    return;
  }
  if (isNeuralAsset(event.request.url)) {
    event.respondWith(caches.open(NEURAL_CACHE).then(cache => cache.match(event.request).then(cached => cached || fetch(event.request).then(response => {
      if (response.ok) {
        const write = cache.put(event.request, response.clone()).catch(() => {});
        neuralWrites.add(write);
        write.then(() => neuralWrites.delete(write));
        event.waitUntil(write);
      }
      return response;
    }))));
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
