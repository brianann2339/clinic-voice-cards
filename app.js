const phrases = [
  { file: '01-results', text: '剛才的檢查已經出來了。' },
  { file: '02-cancer', text: '你得了癌症。' },
  { file: '03-fracture', text: '你這邊骨折了。' },
  { file: '04-flu-a', text: '剛才的快篩結果，你A型流感陽性。' },
  { file: '05-blood', text: '我們等等幫你抽個血。' },
  { file: '06-iv', text: '我們等等幫你打個點滴。' },
  { file: '07-test', text: '我們等等幫你做個快篩。' },
  { file: '08-unwell', text: '你今天哪裡不舒服呢？' },
  { file: '09-pain', text: '有哪邊會痛嗎？' },
  { file: '10-breath', text: '呼吸會喘嗎？' },
  { file: '11-inflammation', text: '你這邊發炎了。' },
  { file: '12-xray-no-fracture', text: 'X光都正常，沒有骨折。' },
  { file: '13-xray-normal', text: 'X光都正常。' },
  { file: '14-introduction', text: '你好，我是侯岳岑醫師，我今天喉嚨沒有聲音，所以只能用語音跟您對話，不好意思。' },
  { file: '15-im-injection', text: '等等幫你打個肌肉針好嗎？' },
  { file: '16-questions', text: '有沒有什麼問題？' },
  { file: '17-oral-meds', text: '那我讓你帶口服藥回家囉。' },
  { file: '18-suture', text: '這個傷口要縫。' },
  { file: '19-keep-dry', text: '傷口回去避免碰水。' },
  { file: '20-tetanus', text: '五年內打過破傷風疫苗嗎？' },
  { file: '21-ecg', text: '我們等等幫你做心電圖。' },
  { file: '22-ct-consent', text: '我們等等幫你做電腦斷層，再幫我簽個同意書。' },
  { file: '23-xray', text: '我們等等幫你照X光。' },
  { file: '24-normal-results', text: '剛才檢查結果都正常，別太擔心。' }
];

const groups = [
  { id: 'opening', name: '開場與問診', files: ['14-introduction', '08-unwell', '09-pain', '10-breath'] },
  { id: 'tests', name: '安排檢查', files: ['05-blood', '07-test', '21-ecg', '23-xray', '22-ct-consent'] },
  { id: 'results', name: '說明結果', files: ['01-results', '24-normal-results', '13-xray-normal', '12-xray-no-fracture', '11-inflammation', '04-flu-a', '03-fracture', '02-cancer'] },
  { id: 'treatment', name: '治療處置', files: ['06-iv', '15-im-injection', '18-suture', '20-tetanus'] },
  { id: 'closing', name: '返家與收尾', files: ['19-keep-dry', '17-oral-meds', '16-questions'] }
];

const audio = document.querySelector('#audio');
const cards = document.querySelector('#cards');
const flowNav = document.querySelector('#flow-nav');
const stopButton = document.querySelector('#stop');
const continueButton = document.querySelector('#continue');
const nowPlaying = document.querySelector('#now-playing');
const playbackLabel = document.querySelector('#playback-label');
const rateInput = document.querySelector('#rate');
const volumeInput = document.querySelector('#volume');
const customText = document.querySelector('#custom-text');
const customSubmit = document.querySelector('#custom-submit');
const voiceSelect = document.querySelector('#custom-voice');
const voiceStatus = document.querySelector('#voice-status');
const synth = 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window ? window.speechSynthesis : null;
let voices = [];
let preferredVoice = '';
let audioContext;
let gainNode;
let activeCard;
let activePhrase;
let activeUtterance;
let activeBlobUrl;
let localWorker;
let localRequest = null;
let playRequest = 0;
let playbackState = '準備好了';
const queue = [];

function updateQueue() {
  playbackLabel.textContent = playbackState + (queue.length ? ' · 待播 ' + queue.length + ' 句' : '');
  const typedCount = queue.filter(item => !item.phrase.file).length;
  document.querySelector('#custom-status').textContent = activePhrase && !activePhrase.file
    ? '自由輸入：' + playbackState + (typedCount ? ' · 另有 ' + typedCount + ' 句待播' : '')
    : typedCount ? '自由輸入待播 ' + typedCount + ' 句' : '可與卡片一起依序播放。';
  for (const card of cards.querySelectorAll('.card')) {
    const count = queue.filter(item => item.card === card).length;
    const position = queue.findIndex(item => item.card === card) + 1;
    card.classList.toggle('is-queued', count > 0);
    card.querySelector('.card-caption').textContent = card === activeCard
      ? '正在播放' + (count ? ' · 另排 ' + count + ' 次' : '')
      : count ? '待播第 ' + position + ' 句' + (count > 1 ? ' · 共 ' + count + ' 次' : '') : '點一下播放';
  }
}

function clearActive() {
  if (activeBlobUrl) {
    audio.pause();
    audio.removeAttribute('src');
    audio.load();
    URL.revokeObjectURL(activeBlobUrl);
    activeBlobUrl = null;
  }
  if (activeCard) {
    activeCard.classList.remove('is-active');
    activeCard.setAttribute('aria-pressed', 'false');
    activeCard.querySelector('.card-caption').textContent = '點一下播放';
    activeCard = null;
  }
  activePhrase = null;
  activeUtterance = null;
  continueButton.hidden = true;
  document.body.classList.remove('is-playing');
  stopButton.disabled = true;
}

function stopPlayback() {
  playRequest += 1;
  queue.length = 0;
  audio.pause();
  if (synth && activeUtterance) synth.cancel();
  if (localRequest !== null) {
    localWorker?.terminate();
    localWorker = null;
    localRequest = null;
  }
  if (Number.isFinite(audio.duration)) audio.currentTime = 0;
  clearActive();
  playbackState = '已停止';
  updateQueue();
  nowPlaying.textContent = '點選任一卡片開始播放';
  nowPlaying.classList.remove('is-custom');
}

function prepareAudio() {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!audioContext && AudioContextClass) {
    audioContext = new AudioContextClass();
    gainNode = audioContext.createGain();
    audioContext.createMediaElementSource(audio).connect(gainNode);
    gainNode.connect(audioContext.destination);
  }
  applySettings();
  return audioContext?.state === 'suspended' ? audioContext.resume() : Promise.resolve();
}

function applySettings() {
  audio.defaultPlaybackRate = Number(rateInput.value);
  audio.playbackRate = Number(rateInput.value);
  audio.preservesPitch = true;
  if ('webkitPreservesPitch' in audio) audio.webkitPreservesPitch = true;
  if (gainNode) {
    audio.volume = 1;
    gainNode.gain.value = Number(volumeInput.value);
  }
  else audio.volume = Number(volumeInput.value);
  document.querySelector('#rate-value').textContent = Number(rateInput.value).toFixed(2) + '×';
  document.querySelector('#volume-value').textContent = Math.round(Number(volumeInput.value) * 100) + '%';
}

function showError(request, message = '待播已清空，請確認網路連線後再點一次卡片。') {
  if (request !== playRequest) return;
  stopPlayback();
  playbackState = '無法播放';
  updateQueue();
  nowPlaying.textContent = message;
}

function finishPlayback(request) {
  if (request !== playRequest) return;
  clearActive();
  if (queue.length) {
    const next = queue.shift();
    playPhrase(next.phrase, next.card);
  } else {
    playbackState = '播放完畢';
    updateQueue();
  }
}

function showContinue(request) {
  if (request !== playRequest) return;
  playbackState = '點一下繼續播放';
  continueButton.hidden = false;
  updateQueue();
}

function playSpeech(phrase, request) {
  const availableVoices = synth ? synth.getVoices().filter(item => item.localService) : [];
  const voice = availableVoices.find(item => item.voiceURI === phrase.voiceURI)
    || availableVoices.find(item => item.name === phrase.voiceName && item.lang === phrase.voiceLang);
  if (!voice) {
    showError(request, '找不到所選的裝置語音。待播已清空，請重新選擇聲音後再試。');
    return;
  }
  const utterance = new SpeechSynthesisUtterance(phrase.text);
  activeUtterance = utterance;
  utterance.voice = voice;
  utterance.lang = voice.lang;
  utterance.rate = 0.95 * Number(rateInput.value);
  continueButton.hidden = false;
  utterance.onstart = () => {
    if (request !== playRequest) return;
    continueButton.hidden = true;
    playbackState = '正在朗讀';
    updateQueue();
    document.body.classList.add('is-playing');
  };
  utterance.onend = () => finishPlayback(request);
  utterance.onerror = event => {
    if (event.error === 'not-allowed') showContinue(request);
    else showError(request, event.error === 'text-too-long'
      ? '文字太長，請分成幾句再播放。待播已清空。'
      : '文字朗讀未成功，待播已清空。請重新選擇聲音後再試。');
  };
  synth.speak(utterance);
}

function playLocal(phrase, request) {
  localRequest = request;
  try {
    if (!localWorker) {
      const worker = new Worker('./local-tts-worker.js', { type: 'module' });
      localWorker = worker;
      worker.onmessage = event => {
        const { request, wav, error } = event.data;
        if (worker !== localWorker || request !== playRequest || request !== localRequest) return;
        if (error) {
          showError(request, '本機合成未成功，待播已清空。請確認語音資源已下載後再試。');
          return;
        }
        localRequest = null;
        activeBlobUrl = URL.createObjectURL(new Blob([wav], { type: 'audio/wav' }));
        playAudio(activeBlobUrl, request);
      };
      worker.onerror = () => {
        if (worker !== localWorker) return;
        const request = localRequest;
        worker.terminate();
        localWorker = null;
        localRequest = null;
        if (request !== null) showError(request, '本機合成未成功，待播已清空。請確認語音資源已下載後再試。');
      };
    }
    localWorker.postMessage({ request, text: phrase.text });
  } catch {
    showError(request, '本機合成未成功，待播已清空。請確認語音資源已下載後再試。');
  }
}

function playPhrase(phrase, card) {
  const request = ++playRequest;
  audio.pause();
  if (synth && (activeUtterance || (!phrase.file && phrase.engine !== 'local'))) synth.cancel();
  clearActive();
  activePhrase = phrase;
  activeCard = card;
  if (card) {
    card.classList.add('is-active');
    card.setAttribute('aria-pressed', 'true');
  }
  playbackState = phrase.file ? '載入語音' : phrase.engine === 'local' ? '正在合成語音' : '準備朗讀';
  updateQueue();
  nowPlaying.textContent = phrase.text;
  nowPlaying.classList.toggle('is-custom', !phrase.file);
  stopButton.disabled = false;
  if (phrase.engine === 'local') {
    playLocal(phrase, request);
  } else if (!phrase.file) {
    playSpeech(phrase, request);
  } else {
    playAudio('./audio/' + phrase.file + '.mp3', request);
  }
}

function playAudio(src, request) {
  if (request !== playRequest) return;
  playbackState = '載入語音';
  continueButton.hidden = true;
  updateQueue();
  const audioReady = prepareAudio();
  audio.src = src;
  applySettings();
  audio.onerror = () => showError(request);
  audio.onended = () => {
    if (audio.ended) finishPlayback(request);
  };
  Promise.all([audioReady, audio.play()]).then(() => {
    if (request !== playRequest) return;
    playbackState = '正在播放';
    updateQueue();
    document.body.classList.add('is-playing');
  }).catch(error => {
    if (error.name === 'NotAllowedError') showContinue(request);
    else showError(request);
  });
}

function enqueuePhrase(phrase, card = null) {
  if (activePhrase) {
    queue.push({ phrase, card });
    updateQueue();
  } else {
    playPhrase(phrase, card);
  }
}

function updateCustomSubmit() {
  customSubmit.disabled = !customText.value.trim() || (voiceSelect.value !== 'local-cmn' && !voices.some(voice => voice.voiceURI === voiceSelect.value));
}

function updateVoiceStatus() {
  voiceStatus.textContent = voiceSelect.value === 'local-cmn'
    ? '使用本機合成（相容模式）；音量依播放設定，聲音較機械，文字不會外傳。'
    : '使用裝置上的中文語音；朗讀音量請用裝置音量鍵調整，聲線可能與固定卡片不同。';
}

function refreshVoices() {
  const selected = voiceSelect.value || preferredVoice;
  const previous = voices.find(voice => voice.voiceURI === selected);
  voices = synth ? synth.getVoices().filter(voice => voice.localService && /^zh(?:[-_]|$)/i.test(voice.lang)) : [];
  voices.sort((a, b) => Number(/^zh[-_]TW$/i.test(b.lang)) - Number(/^zh[-_]TW$/i.test(a.lang)) || Number(b.default) - Number(a.default));
  voiceSelect.replaceChildren();
  const localOption = document.createElement('option');
  localOption.value = 'local-cmn';
  localOption.textContent = '本機合成（相容模式）';
  voiceSelect.append(localOption);
  for (const voice of voices) {
    const option = document.createElement('option');
    option.value = voice.voiceURI;
    option.textContent = voice.name + '（' + voice.lang + '）';
    voiceSelect.append(option);
  }
  const matching = voices.find(voice => voice.voiceURI === selected)
    || voices.find(voice => voice.name === previous?.name && voice.lang === previous?.lang);
  if (matching) voiceSelect.value = matching.voiceURI;
  voiceSelect.disabled = false;
  document.querySelector('#reload-voices').hidden = !synth || voices.length > 0;
  updateVoiceStatus();
  updateCustomSubmit();
}

try { preferredVoice = localStorage.getItem('voice-card-voice-v11') || ''; } catch {}
if (synth) synth.addEventListener('voiceschanged', refreshVoices);
refreshVoices();
voiceSelect.addEventListener('change', () => {
  preferredVoice = voiceSelect.value;
  try { localStorage.setItem('voice-card-voice-v11', preferredVoice); } catch {}
  updateVoiceStatus();
  updateCustomSubmit();
});
document.querySelector('#reload-voices').addEventListener('click', refreshVoices);
customText.addEventListener('input', updateCustomSubmit);
document.querySelector('#custom-clear').addEventListener('click', () => {
  customText.value = '';
  updateCustomSubmit();
  customText.focus();
});
document.querySelector('#custom-form').addEventListener('submit', event => {
  event.preventDefault();
  const text = customText.value.trim();
  const voiceURI = voiceSelect.value;
  if (!text) return;
  if (voiceURI === 'local-cmn') {
    enqueuePhrase({ text, engine: 'local' });
  } else {
    const voice = voices.find(voice => voice.voiceURI === voiceURI);
    if (!voice) return;
    enqueuePhrase({ text, voiceURI, voiceName: voice.name, voiceLang: voice.lang });
  }
  customText.blur();
});

const typing = document.querySelector('#typing');
typing.open = false;
flowNav.querySelector('.typing-link').addEventListener('click', () => { typing.open = true; });

let cardNumber = 0;
groups.forEach((group, index) => {
  const link = document.createElement('a');
  link.href = '#' + group.id;
  link.textContent = group.name;
  flowNav.append(link);

  const section = document.createElement('section');
  section.id = group.id;
  section.className = 'phrase-group';
  section.setAttribute('aria-labelledby', group.id + '-title');
  section.innerHTML = '<div class="group-heading"><span class="group-step" aria-hidden="true">' + String(index + 1).padStart(2, '0') + '</span><h2 id="' + group.id + '-title"></h2><span class="group-count">' + group.files.length + ' 句</span></div><div class="cards"></div>';
  section.querySelector('h2').textContent = group.name;

  for (const file of group.files) {
    const phrase = phrases.find(item => item.file === file);
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'card';
    card.dataset.file = phrase.file;
    card.setAttribute('aria-label', '播放：' + phrase.text);
    card.setAttribute('aria-pressed', 'false');
    card.innerHTML = '<span class="card-top"><span class="card-number">' + String(++cardNumber).padStart(2, '0') + '</span><span class="card-play" aria-hidden="true"><svg viewBox="0 0 12 14"><path fill="currentColor" d="M1 0 12 7 1 14Z"/></svg></span></span><span class="card-text"></span><span class="card-caption" aria-hidden="true">點一下播放</span>';
    card.querySelector('.card-text').textContent = phrase.text;
    card.addEventListener('click', () => enqueuePhrase(phrase, card));
    section.querySelector('.cards').append(card);
  }
  cards.append(section);
});
new ResizeObserver(() => {
  document.documentElement.style.setProperty('--flow-nav-height', flowNav.offsetHeight + 'px');
}).observe(flowNav);
function updateTypingLayout() {
  document.body.classList.toggle('compact-typing', (window.visualViewport?.height || window.innerHeight) < 600);
}
window.visualViewport?.addEventListener('resize', updateTypingLayout);
window.addEventListener('resize', updateTypingLayout);
updateTypingLayout();

audio.addEventListener('loadedmetadata', applySettings);
stopButton.addEventListener('click', stopPlayback);
continueButton.addEventListener('click', () => {
  if (activeBlobUrl) {
    audio.pause();
    playAudio(activeBlobUrl, ++playRequest);
  } else if (activePhrase) playPhrase(activePhrase, activeCard);
});
document.querySelector('#settings-toggle').addEventListener('click', event => {
  const settings = document.querySelector('#settings');
  settings.hidden = !settings.hidden;
  event.currentTarget.setAttribute('aria-expanded', String(!settings.hidden));
});
for (const input of [rateInput, volumeInput]) {
  input.addEventListener('input', () => {
    applySettings();
    try {
      localStorage.setItem('voice-card-settings', JSON.stringify({ rate: rateInput.value, volume: volumeInput.value }));
    } catch {}
  });
}
try {
  const saved = JSON.parse(localStorage.getItem('voice-card-settings') || 'null');
  if (saved) {
    if (Number(saved.rate) >= 0.8 && Number(saved.rate) <= 1.2) rateInput.value = saved.rate;
    if (Number(saved.volume) >= 0 && Number(saved.volume) <= 1) volumeInput.value = saved.volume;
  }
} catch {}
applySettings();
document.addEventListener('visibilitychange', () => { if (document.hidden) stopPlayback(); });
window.addEventListener('pagehide', stopPlayback);
document.addEventListener('keydown', event => { if (event.key === 'Escape') stopPlayback(); });

if ('serviceWorker' in navigator) {
  const checkOfflineReady = () => navigator.serviceWorker.controller?.postMessage('check-offline-ready');
  navigator.serviceWorker.addEventListener('message', event => {
    if (event.data?.cache === 'clinic-voice-cards-v11') {
      document.querySelector('#offline-status').textContent = '卡片與相容語音已備妥 · 可離線使用';
    }
  });
  navigator.serviceWorker.addEventListener('controllerchange', checkOfflineReady);
  checkOfflineReady();
  navigator.serviceWorker.register('./sw.js', { updateViaCache: 'none' })
    .then(() => navigator.serviceWorker.ready).then(checkOfflineReady).catch(() => {});
}
