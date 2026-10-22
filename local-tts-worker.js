import { createEspeak, encodeWav } from './vendor/spellophone/dist/browser.js';

let enginePromise;

self.onmessage = async event => {
  const { request, text } = event.data;
  try {
    if (!enginePromise) {
      enginePromise = createEspeak({
        dataUrl: new URL('./vendor/spellophone/espeak-ng-data/', import.meta.url),
        languages: ['cmn']
      }).then(engine => {
        engine.setVoice('cmn');
        return engine;
      });
    }
    const engine = await enginePromise;
    const result = engine.synthesize(text, { rate: 165, pitch: 38 });
    const wav = encodeWav(result.samples, result.sampleRate);
    self.postMessage({ request, wav }, [wav.buffer]);
  } catch (error) {
    enginePromise = null;
    self.postMessage({ request, error: error.message || String(error) });
  }
};
