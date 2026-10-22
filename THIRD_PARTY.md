# 原始碼與授權

含本機合成模式的網頁程式碼以 GPL-3.0-or-later 發布，條款見 [LICENSE](LICENSE)。網頁 HTML、CSS、JavaScript 及整合用的 [local-tts-worker.js](local-tts-worker.js) 均可在[本專案原始碼](https://github.com/brianann2339/clinic-voice-cards)取得，不需建置即可部署。固定 MP3 音檔不屬於下列第三方語音引擎。

## Spellophone 0.2.1

- 作者：Spelling Creator。
- 授權：[GPL-3.0-or-later](vendor/spellophone/LICENSE)。
- 上游：[Spelling-Creator/spellophone](https://github.com/Spelling-Creator/spellophone)。
- 固定版本：`v0.2.1`，commit `6d51a872d54a773e4969d7130fdaed665b2d6d18`。
- [完整對應原始碼下載](vendor/spellophone/source/spellophone-6d51a872d54a773e4969d7130fdaed665b2d6d18.tar.gz)，含 C glue、TypeScript、建置腳本、套件版本及字典編譯 patch。
- 原始碼壓縮檔 SHA-256：`6702e673c93ea1d8d90300a162d64aaab9fdc23737068173ec54e0c0ca4c58c6`。

執行檔取自 [npm 0.2.1 套件](https://registry.npmjs.org/@spelling-creator/spellophone/-/spellophone-0.2.1.tgz)。保留 `dist/browser.js`、`dist/core-w4y-vCu9.js`、`wasm/espeak-ng.js`、`wasm/espeak-ng.wasm`，上述程式及 WASM 未修改。

2026-10-22 的資料包調整：將 `core.bin.gz`、`en_dict.gz`、`cmn_dict.gz` 以標準 gzip 解壓成 `core.bin`、`en_dict`、`cmn_dict`；將 `manifest.json` 的 `encoding` 改成 `identity`，並更新這三個檔名。解壓後資料內容不變。此調整讓載入不依賴瀏覽器的 `DecompressionStream`。未部署其他語言的字典；保留完整 core 內的語音定義。

## eSpeak NG 1.52.0

- 主要作者：Jonathan Duddington（eSpeak）、Reece H. Dunn（eSpeak NG）及上游貢獻者。
- 授權：[GPL-3.0-or-later](vendor/spellophone/notices/espeak-ng/COPYING)。
- 上游：[espeak-ng/espeak-ng](https://github.com/espeak-ng/espeak-ng)。
- 固定版本：`1.52.0`，commit `4870adfa25b1a32b4361592f1be8a40337c58d6c`。
- [完整對應原始碼下載](vendor/spellophone/source/espeak-ng-4870adfa25b1a32b4361592f1be8a40337c58d6c.tar.gz)，包含中文擴充字典。
- 原始碼壓縮檔 SHA-256：`cd83f84c4e495f281ac14e919aecf2834306ec1ea1b498de8ef6000f3a0f90de`。

Spellophone 的 source archive 另含 `vendor/patches/0001-deterministic-dictionary-compile.patch`，其建置會套用此 patch；重建時應連同 Spellophone 的 glue 與腳本使用，不能只編譯未修改的 eSpeak NG。依上游 `mise.toml` 與 packageManager 設定，工具版本為 emsdk 6.0.12、Node 24、pnpm 12.4.1。完整建置方式見 source 中的文件及 [上游建置說明](https://spellophone.spellingcreator.org/project/building)。請使用固定 tag 的 Git checkout，以保留建置腳本需要的 Git 版本資訊。

其他上游授權原文一併保留：[Apache-2.0](vendor/spellophone/notices/espeak-ng/COPYING.APACHE)、[BSD-2-Clause](vendor/spellophone/notices/espeak-ng/COPYING.BSD2)、[Unicode](vendor/spellophone/notices/espeak-ng/COPYING.UCD)、[ucd-tools](vendor/spellophone/notices/espeak-ng/src/ucd-tools/COPYING)及 [ucd-tools Unicode](vendor/spellophone/notices/espeak-ng/src/ucd-tools/COPYING.UCD)。

語音引擎與字典由本網站提供；輸入文字只在網頁與本機 Worker 間傳遞，不會送至 npm、上游專案或其他語音服務。原始碼附件供下載查閱，不加入離線預載。
