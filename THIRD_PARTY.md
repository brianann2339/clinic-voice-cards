# 原始碼與授權

含本機合成模式的網頁程式碼以 GPL-3.0-or-later 發布，條款見 [LICENSE](LICENSE)。網頁 HTML、CSS、JavaScript 及整合用的 [local-tts-worker.js](local-tts-worker.js)、[neural-tts-worker.js](neural-tts-worker.js) 均可在[本專案原始碼](https://github.com/brianann2339/clinic-voice-cards)取得，不需建置即可部署。固定 MP3 音檔不屬於下列第三方語音引擎。

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

以下元件用於自由輸入預設的「超文」語音（[neural-tts-worker.js](neural-tts-worker.js)）與 [neural-preview.html](neural-preview.html) 比較頁。sherpa-onnx 引擎、opencc-js 與超文模型檔在第一次載入時由 Service Worker 存入獨立快取；AISHELL-3 模型不快取。

## sherpa-onnx 2.0.0（WebAssembly 文字轉語音）

- 作者：k2-fsa（Next-gen Kaldi）專案及其貢獻者。
- 授權：[Apache-2.0](vendor/sherpa-onnx/LICENSE)。
- 上游：[k2-fsa/sherpa-onnx](https://github.com/k2-fsa/sherpa-onnx)。
- 固定版本：`v2.0.0`，commit `8abb7c8f87eae85b2e75f9a4115236c978980add`（2026-10-23 發布）。本專案未自行建置，直接使用官方 CI 產物；重建方式見上游 `build-wasm-simd-tts.sh` 與 `wasm/tts/assets/README.md`。
- 執行檔取自官方 release 資產 [sherpa-onnx-wasm-simd-2.0.0-vits-piper-de_DE-thorsten_emotional-medium.tar.bz2](https://github.com/k2-fsa/sherpa-onnx/releases/download/v2.0.0/sherpa-onnx-wasm-simd-2.0.0-vits-piper-de_DE-thorsten_emotional-medium.tar.bz2)（SHA-256 `64e9e75f632aaa56de0a34dcc65635bd03e4878c8a819b929253ee91d8768c0f`）。保留 `sherpa-onnx-wasm-main-tts.js`（SHA-256 `eddc416350b280ba07af67836e6a2cbf86663b921625151ae22f3a135a427ec3`）、`sherpa-onnx-wasm-main-tts.wasm`（`b0a84503747bbefd2e06003518ba6588edaae8e4057ad72af9c5853d231531f1`）、`sherpa-onnx-tts.js`（`0f66769feeb012282c984014c56c7e3b5239d4ef9559298d196affda3b9e751e`），三者未修改。同版 en_US 資產 `sherpa-onnx-wasm-simd-2.0.0-vits-piper-en_US-libritts_r-medium.tar.bz2`（SHA-256 `317dcd8c626fcced0881c0c78c6ba8d284c449652a6c320e1404542ec3296e6e`）內的這三個檔案 SHA-256 完全相同，可見 wasm 本體不含模型。資產內的德語模型預載包 `.data` 與 piper-phonemize 未納入；glue 內建的預載程式由 [neural-tts-worker.js](neural-tts-worker.js) 透過 `getPreloadedPackage` 交給它一個空封包，模型檔改在執行期下載後寫入 MEMFS。
- `sherpa-onnx-wasm-main-tts.lowmem.wasm`（SHA-256 `a1385b537239ec99d54b22f4e992f60f2b0c91429eb1151eec70082107efbac8`）是本專案複製官方 wasm 後修改 1 個位元組：第 22117 個位元組（從 1 起算）由 `0x40` 改為 `0x10`，即 WebAssembly memory 區段的起始頁數從 8192 頁（512 MB）改為 2048 頁（128 MB）；最大值 32768 頁（2 GB）與其餘內容不變。供記憶體受限裝置備用。
- wasm 內靜態連結的主要第三方元件（依上游 v2.0.0 `cmake/` 目錄與 wasm 內的來源路徑字串）：onnxruntime 1.28.2（MIT，[授權全文](vendor/sherpa-onnx/notices/onnxruntime-LICENSE)；靜態庫來自 csukuangfj/onnxruntime-libs v1.28.2 的 `onnxruntime-wasm-static_lib-simd-1.28.2.zip`，SHA-256 `88688849b67fed9ca0e9fb2bf92ce19a5def9e8c2c8c2df34eb235d25893232a`）、openfst `v1.8.5-2026-07-09`（csukuangfj 分支，Apache-2.0，原始碼 SHA-256 `2ff712a32952fcb01d351121a6bc8ccf4fdc6b2aa06ce8df2b3095dedd518c0e`）、kaldi-decoder v0.3.0 與其引入的 kaldifst（k2-fsa，Apache-2.0；wasm 內含 kaldifst 的 `kaldi-fst-io.cc`、`kaldi-io.cc` 路徑字串，kaldifst 版本未另查）、utf8proc v2.12.0（MIT 式授權與 Unicode 資料授權，[授權全文](vendor/sherpa-onnx/notices/utf8proc-LICENSE.md)，原始碼 SHA-256 `f564011d38b2888d583d510b08e69ffa15aa117155db1b9b49ef1dfe1fa25111`）以及 Emscripten 執行階段。eSpeak NG 與 piper-phonemize 自 2.0.0 起不再由 sherpa-onnx 使用，亦不在此 wasm 內。完整依賴以上游該 commit 的 `cmake/` 目錄為準。

## opencc-js 1.4.2（繁轉簡）

- 作者：nk2028 專案。
- 授權：[MIT](vendor/opencc-js/LICENSE)；內嵌的 OpenCC 字典資料為 Apache-2.0（[THIRD_PARTY_LICENSES.md](vendor/opencc-js/THIRD_PARTY_LICENSES.md)）。
- 上游：[nk2028/opencc-js](https://github.com/nk2028/opencc-js)。
- 固定版本：npm [opencc-js@1.4.2](https://registry.npmjs.org/opencc-js/-/opencc-js-1.4.2.tgz)（套件 SHA-256 `acde2ed46fecc53eb1c329ff093886bf702975be24ace4caa3d01321167d69c8`，2026-08-22 發布）。保留 `dist/umd/t2cn.js`（SHA-256 `5009384a6bdc904babee967a8bb9928e3c92288ec8a89ed036d53257e74cd8ab`），未修改。Worker 以 `{ from: 'tw', to: 'cn' }` 做字級繁轉簡，不做詞彙轉換（不會把「軟體」改成「软件」）。

## 語音模型：vits-piper-zh_CN-chaowen-medium-int8（超文）

- 來源：sherpa-onnx `tts-models` release 資產 [vits-piper-zh_CN-chaowen-medium-int8.tar.bz2](https://github.com/k2-fsa/sherpa-onnx/releases/download/tts-models/vits-piper-zh_CN-chaowen-medium-int8.tar.bz2)（SHA-256 `f5f7c8628427fbb259ea4b7ec1a9a822a0c04e3f267071f0abfa0610371d9e0c`）。原始語音為 Piper 的 [rhasspy/piper-voices `zh/zh_CN/chaowen/medium`](https://huggingface.co/rhasspy/piper-voices/tree/main/zh/zh_CN/chaowen/medium)，由 sherpa-onnx 轉為 int8 並附上 lexicon 版文字前端。
- 檔案：`zh_CN-chaowen-medium.onnx`（SHA-256 `d5ad252f165b26bcecb01759d07cc6cf4cf14045bac8752947a5fb35080c5e6b`）、`zh_CN-chaowen-medium.onnx.json`、`tokens.txt`、`lexicon.txt`（SHA-256 `003e76f89fec389ec109b557f47cc315a1ac31a99091f0cc9d15949f9024416b`，與上游另行發布的 `lexicon-zh-g2pw.txt` 相同）、`phone.fst`、`date.fst`、`number.fst`、`MODEL_CARD`，皆未修改。
- 授權：rhasspy/piper-voices 儲存庫標示 MIT；MODEL_CARD 記載資料集為 [OHF-Voice/voice-datasets](https://github.com/OHF-Voice/voice-datasets)（CC0），但模型為「Finetuned from Xiao Ya voice」，而小雅（xiao_ya）的 MODEL_CARD 標示其資料集 Data-Baker BZNSYP 為 Non-commercial use。微調後的權重是否承襲非商用限制，上游未說明；本專案視為**未釐清**；自 2026-10-24 起在自由輸入預設使用此模型（個人診間用途、非商業），模型檔也隨本網站與公開 repo 一併散布；授權邊界仍待向上游確認。`lexicon.txt` 的產生方式與授權未查證。

## 語音模型：vits-icefall-zh-aishell3

- 來源：sherpa-onnx `tts-models` release 資產 [vits-icefall-zh-aishell3.tar.bz2](https://github.com/k2-fsa/sherpa-onnx/releases/download/tts-models/vits-icefall-zh-aishell3.tar.bz2)（SHA-256 `ab468db3a3308cdd861495e0db2f25d79418a0c00639f74944c7cdf5dd8c6ec1`），以 [icefall](https://github.com/k2-fsa/icefall) 的 AISHELL-3 VITS 配方訓練並由 k2-fsa 匯出。
- 檔案：`model.onnx`（SHA-256 `5511d651b7840c0a93a6bbfd4afd070a2c7f39ca1ec3ff2ecd73191519bbb852`）、`tokens.txt`、`lexicon.txt`、`speakers.txt`、`phone.fst`、`date.fst`、`number.fst`、`new_heteronym.fst`，皆未修改。資產內 180 MB 的 `rule.far` 文字正規化規則未納入。
- 授權：icefall 為 Apache-2.0；AISHELL-3 語料（OpenSLR SLR93）標示 Apache License v.2.0。此模型取樣率 8 kHz、174 位說話者。

自由輸入與試點頁的輸入文字只在網頁與本機 Worker 間傳遞，引擎與模型皆由本網站提供，不會送至任何語音服務。
