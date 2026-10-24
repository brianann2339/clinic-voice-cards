'use strict';
// 離線神經語音試點：在 Worker 內以 sherpa-onnx 2.0.0 WebAssembly 合成 WAV。
// 官方 wasm 未修改；模型檔不用 emscripten 預載包，改由本 Worker 下載後寫入 MEMFS。

const SHERPA_DIR = 'vendor/sherpa-onnx/';
const WASM_FILES = { standard: 'sherpa-onnx-wasm-main-tts.wasm', lowmem: 'sherpa-onnx-wasm-main-tts.lowmem.wasm' };

let tts = null;
let loading = false;
const logLines = [];

const now = () => performance.now();
const post = (message, transfer) => self.postMessage(message, transfer || []);
const errorText = error => (error && error.stack) ? `${error.message}\n${error.stack}` : String(error && error.message || error);

function log(line) {
  const text = String(line);
  logLines.push(text);
  if (logLines.length > 2000) logLines.splice(0, logLines.length - 2000);
  post({ type: 'log', line: text });
}

async function fetchWithProgress(url, onProgress) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`HTTP ${response.status}：${url}`);
  const total = Number(response.headers.get('Content-Length')) || 0;
  if (!response.body) {
    const buffer = await response.arrayBuffer();
    onProgress(buffer.byteLength, buffer.byteLength);
    return buffer;
  }
  const reader = response.body.getReader();
  const chunks = [];
  let loaded = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    loaded += value.length;
    onProgress(loaded, total);
  }
  const out = new Uint8Array(loaded);
  let offset = 0;
  for (const chunk of chunks) { out.set(chunk, offset); offset += chunk.length; }
  return out.buffer;
}

function buildConfig(model) {
  const dir = '/model/';
  return {
    offlineTtsModelConfig: {
      offlineTtsVitsModelConfig: {
        model: dir + model.model,
        lexicon: dir + model.lexicon,
        tokens: dir + model.tokens,
        dataDir: '',
        noiseScale: 0.667,
        noiseScaleW: 0.8,
        lengthScale: 1.0
      },
      numThreads: 1,
      debug: 1,
      provider: 'cpu'
    },
    ruleFsts: model.fsts.map(name => dir + name).join(','),
    ruleFars: '',
    maxNumSentences: 1
  };
}

async function load({ model, wasm }) {
  if (loading || tts) throw new Error('引擎已在載入或已就緒');
  loading = true;
  const wasmName = WASM_FILES[wasm] || WASM_FILES.standard;
  const t0 = now();
  const bytes = { wasm: 0, model: {} };

  const wasmBuffer = await fetchWithProgress(SHERPA_DIR + wasmName,
    (loaded, total) => post({ type: 'progress', stage: 'wasm', file: wasmName, loaded, total }));
  bytes.wasm = wasmBuffer.byteLength;
  const tWasmDownloaded = now();

  const modelFiles = [model.model, model.tokens, model.lexicon, ...model.fsts];
  const filesPromise = Promise.all(modelFiles.map(name =>
    fetchWithProgress(model.dir + name, (loaded, total) => post({ type: 'progress', stage: 'model', file: name, loaded, total }))
      .then(buffer => { bytes.model[name] = buffer.byteLength; return [name, buffer]; })));

  const runtime = new Promise((resolve, reject) => {
    self.Module = {
      wasmBinary: wasmBuffer,
      locateFile: (path, directory = '') => directory + SHERPA_DIR + (path === WASM_FILES.standard ? wasmName : path),
      // 官方 glue 內建 emscripten 預載包（原本裝著德語模型）的載入程式；這裡交給它一個空的封包，
      // 讓它不去抓 .data 檔，模型改由下方寫入 MEMFS。
      getPreloadedPackage: () => new ArrayBuffer(0),
      print: log,
      printErr: log,
      setStatus: () => {},
      onAbort: reason => reject(new Error('WebAssembly 中止：' + reason)),
      onRuntimeInitialized: resolve
    };
    try {
      importScripts(SHERPA_DIR + 'sherpa-onnx-wasm-main-tts.js', SHERPA_DIR + 'sherpa-onnx-tts.js');
    } catch (error) {
      reject(error);
    }
  });
  const tInstantiateStart = now();
  await runtime;
  const tRuntimeReady = now();
  const files = await filesPromise;
  const tFilesReady = now();

  Module.FS_createPath('/', 'model', true, true);
  for (const [name, buffer] of files) Module.FS_createDataFile('/model', name, new Uint8Array(buffer), true, true, true);
  const tInitStart = now();
  tts = createOfflineTts(Module, buildConfig(model));
  const tInitEnd = now();
  loading = false;

  post({
    type: 'ready',
    sampleRate: tts.sampleRate,
    numSpeakers: tts.numSpeakers,
    lang: tts.lang,
    bytes,
    heapBytes: Module.HEAPU8.length,
    timings: {
      wasmDownloadMs: tWasmDownloaded - t0,
      wasmInstantiateMs: tRuntimeReady - tInstantiateStart,
      modelFilesReadyAtMs: tFilesReady - t0,
      engineInitMs: tInitEnd - tInitStart,
      totalMs: tInitEnd - t0
    }
  });
}

function encodeWav(samples, sampleRate) {
  const count = samples.length;
  const buffer = new ArrayBuffer(44 + count * 2);
  const view = new DataView(buffer);
  const ascii = (offset, text) => { for (let i = 0; i < text.length; i++) view.setUint8(offset + i, text.charCodeAt(i)); };
  ascii(0, 'RIFF'); view.setUint32(4, 36 + count * 2, true); ascii(8, 'WAVE');
  ascii(12, 'fmt '); view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true); view.setUint32(28, sampleRate * 2, true); view.setUint16(32, 2, true); view.setUint16(34, 16, true);
  ascii(36, 'data'); view.setUint32(40, count * 2, true);
  let offset = 44;
  let peak = 0;
  let sumSquares = 0;
  for (let i = 0; i < count; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    const magnitude = Math.abs(s);
    if (magnitude > peak) peak = magnitude;
    sumSquares += s * s;
    view.setInt16(offset, s < 0 ? s * 32768 : s * 32767, true);
    offset += 2;
  }
  return { buffer, peak, rms: count ? Math.sqrt(sumSquares / count) : 0 };
}

function generate({ id, text, sid, speed }) {
  const logStart = logLines.length;
  if (!tts) {
    post({ type: 'error', stage: 'generate', id, message: '引擎尚未就緒' });
    return;
  }
  const t0 = now();
  try {
    const audio = tts.generate({ text, sid: sid || 0, speed: speed || 1.0 });
    const synthMs = now() - t0;
    const wav = encodeWav(audio.samples, audio.sampleRate);
    post({
      type: 'result', id, wav: wav.buffer, sampleRate: audio.sampleRate, numSamples: audio.samples.length,
      synthMs, peak: wav.peak, rms: wav.rms, heapBytes: Module.HEAPU8.length, log: logLines.slice(logStart)
    }, [wav.buffer]);
  } catch (error) {
    post({ type: 'error', stage: 'generate', id, message: errorText(error), log: logLines.slice(logStart) });
  }
}

self.onmessage = event => {
  const message = event.data;
  if (message.type === 'load') {
    load(message).catch(error => { loading = false; post({ type: 'error', stage: 'load', message: errorText(error) }); });
  } else if (message.type === 'generate') {
    generate(message);
  }
};
