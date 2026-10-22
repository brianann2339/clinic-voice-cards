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
  { file: '20-tetanus', text: '五年內打過破傷風疫苗嗎？' }
];

const audio = document.querySelector('#audio');
const cards = document.querySelector('#cards');
const stopButton = document.querySelector('#stop');
const nowPlaying = document.querySelector('#now-playing');
const playbackLabel = document.querySelector('#playback-label');
const rateInput = document.querySelector('#rate');
const volumeInput = document.querySelector('#volume');
let audioContext;
let gainNode;
let activeCard;
let playRequest = 0;

function clearActive() {
  if (activeCard) {
    activeCard.classList.remove('is-active');
    activeCard.setAttribute('aria-pressed', 'false');
    activeCard.querySelector('.card-caption').textContent = '點一下播放';
    activeCard = null;
  }
  document.body.classList.remove('is-playing');
  stopButton.disabled = true;
}

function stopPlayback() {
  playRequest += 1;
  audio.pause();
  if (Number.isFinite(audio.duration)) audio.currentTime = 0;
  clearActive();
  playbackLabel.textContent = '已停止';
  nowPlaying.textContent = '點選任一卡片開始播放';
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

function showError(request) {
  if (request !== playRequest) return;
  audio.pause();
  clearActive();
  playbackLabel.textContent = '尚未播放';
  nowPlaying.textContent = '請確認網路連線，再點一次卡片。';
}

function playPhrase(phrase, card) {
  const request = ++playRequest;
  audio.pause();
  clearActive();
  const audioReady = prepareAudio();
  activeCard = card;
  card.classList.add('is-active');
  card.setAttribute('aria-pressed', 'true');
  card.querySelector('.card-caption').textContent = '正在播放';
  playbackLabel.textContent = '載入語音';
  nowPlaying.textContent = phrase.text;
  stopButton.disabled = false;
  audio.src = './audio/' + phrase.file + '.mp3';
  applySettings();
  audio.onerror = () => showError(request);
  Promise.all([audioReady, audio.play()]).then(() => {
    if (request !== playRequest) return;
    playbackLabel.textContent = '正在播放';
    document.body.classList.add('is-playing');
  }).catch(() => showError(request));
}

phrases.forEach((phrase, index) => {
  const card = document.createElement('button');
  card.type = 'button';
  card.className = 'card';
  card.setAttribute('aria-label', '播放：' + phrase.text);
  card.setAttribute('aria-pressed', 'false');
  card.innerHTML = '<span class="card-top"><span class="card-number">' + String(index + 1).padStart(2, '0') + '</span><span class="card-play" aria-hidden="true"><svg viewBox="0 0 12 14"><path fill="currentColor" d="M1 0 12 7 1 14Z"/></svg></span></span><span class="card-text"></span><span class="card-caption" aria-hidden="true">點一下播放</span>';
  card.querySelector('.card-text').textContent = phrase.text;
  card.addEventListener('click', () => playPhrase(phrase, card));
  cards.append(card);
});

audio.addEventListener('loadedmetadata', applySettings);
audio.addEventListener('ended', () => {
  clearActive();
  playbackLabel.textContent = '播放完畢';
});
stopButton.addEventListener('click', stopPlayback);
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
  navigator.serviceWorker.register('./sw.js', { updateViaCache: 'none' }).then(async registration => {
    const worker = registration.installing || registration.waiting;
    if (worker && worker.state !== 'activated') {
      await new Promise((resolve, reject) => {
        const checkState = () => {
          if (worker.state === 'activated') resolve();
          if (worker.state === 'redundant') reject(new Error('語音離線更新未完成'));
        };
        worker.addEventListener('statechange', checkState);
        checkState();
      });
    }
    return navigator.serviceWorker.ready;
  }).then(() => {
    document.querySelector('#offline-status').textContent = '語音已備妥 · 可離線使用';
  }).catch(() => {});
}
