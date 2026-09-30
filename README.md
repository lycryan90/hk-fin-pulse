# 聽為主 · 大局觀（hk-fin-pulse）

免費、可本地運行的香港視角每日新聞 digest：**港聞 10 + 國際 10**，含宏觀引言、當日主線、**與昨日對照**、大局觀思考題、逐則概要／宏觀分析，以及 20 則因果**閉環總結**。

不收費、不需登入、不依賴付費新聞 API。公開 RSS + 啟發式繁中寫手為預設；可選 OpenAI 相容／Ollama 加強文筆。

## 快速開始

```bash
npm install
npm run digest:seed   # 寫入演示報告（可選）
npm run digest        # 抓取 RSS 並生成（預設港式中文）
npm run digest:en     # 全英式英文報告
npm run digest:zh     # 全港式中文報告
npm run dev           # http://localhost:3457
```

### 語言規則

- **港中（zh-HK）**：全文香港繁體／港式用語，英文來源標題會改寫成中文，禁止中英夾雜。
- **英式（en-GB）**：全文 British English（UK spelling/grammar），中文來源標題會改寫成英文。
- 預覽頁可切換語言後按「重新生成」；偏好會存入瀏覽器 localStorage。
- **朗讀**：頁頂「朗讀」使用瀏覽器 Web Speech API（免費），按報告語言選 `zh-HK`／`en-GB` 聲線。

瀏覽：

- `/` 最新日報（**重搜** = 重新抓 RSS 並分析；**PDF** = 列印／另存 PDF）
- `/outlook` 趨勢及展望
- `/settings` **LLM 設定**（雲端 API Key 或本地 Ollama Base URL／Model）
- `/history` 本地歷史
- `GET/PUT /api/settings` · `GET/POST /api/digest` · `GET/POST /api/outlook`

## Linux 安裝（最簡單）

已經下載／解壓之後，入資料夾打一行：

```bash
bash setup.sh
hk-fin-pulse   # http://127.0.0.1:3457
```

有網絡一鍵裝：

```bash
curl -fsSL https://cdn.jsdelivr.net/gh/lycryan90/hk-fin-pulse@main/setup.sh | bash
```

已經下載� https://cdn.jsdelivr.net/gh/lycryan90/hk-fin-pulse@main/setup.sh | bash
```

已經下載咗 ZIP／USB 就唔使 curl，直接喺資料夾入面：`bash setup.sh`。

詳見 [`install/linux/README.md`](install/linux/README.md)。

## 趨勢及展望（建議接 LLM）

每週綜合近日 digest + 最新頭條，寫：

- 全球地緣政治
- 金融與貨幣
- 中港政治經濟核心
- 板塊輪動（油價／黃金、新股潮、息口敏感 vs 防守等）
- 下週留意清單

```bash
npm run outlook          # 優先 LLM；失敗則骨架 fallback
npm run outlook:heuristic
```

## 自動排程（本機 cron）

```bash
npm run cron:install
# 每日 07:00 → npm run digest
# 逢星期五 21:00 → npm run outlook
npm run cron:remove
```

## 可選 LLM

趨勢頁**強烈建議**設定 LLM（Gemini／OpenAI 相容／Ollama），否則只得結構骨架。

```bash
cp .env.example .env
# LLM_API_KEY=...
# LLM_BASE_URL=https://generativelanguage.googleapis.com/v1beta/openai
# LLM_MODEL=gemini-3.8-flash
```

## 新聞來源

見 [`config/sources.json`](config/sources.json)：RTHK（本地／大中華／國際）、Google News（港股金融、金管局／HIBOR、監管）、Guardian／NPR 等。可自行增刪，無需付費 API。

## 架構摘要

管線：`ingest → normalize → score → diversify → themes → draft/weave → validate → persist`

- 選題憲章：[`src/lib/policy/editorial.ts`](src/lib/policy/editorial.ts)
- 昨日對照：[`src/lib/digest/compare.ts`](src/lib/digest/compare.ts)
- 產出：`data/latest-digest.json`、`data/history/YYYY-MM-DD.json`

## 免責

本工具只做宏觀閱讀與教育用途，**不構成投資建議**。報告頁頂、頁尾與 Markdown 匯出均附免責聲明。
