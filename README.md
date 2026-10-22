# 診間語音

適合 iPad 的繁體中文語音卡片。20 句台詞使用預先產生的台灣華語低沉男聲 MP3，不依賴裝置的系統語音。

## 使用

點一下卡片播放；再點另一張會停止原句並切換。底部可停止播放，播放設定可調整語速與音量。支援鍵盤 Tab、Enter，以及 Escape 停止。切換至背景時停止發聲。

第一次連網載入後，Service Worker 快取頁面及全部語音，可供離線使用（瀏覽器可能自行清除快取）。iPad Safari 可用分享選單加入主畫面。

## 開發與部署

純 HTML、CSS、JavaScript，無需建置。以 `python3 -m http.server 8765` 預覽，GitHub Pages 使用 main 分支根目錄。

語音生成方式見 `tools/generate_audio.py`；固定使用 Microsoft `zh-TW-YunJheNeural` 男聲，稍慢語速與降低音高。語音檔不包含任何實際病人資料。使用時不呼叫語音生成服務。
