# 聽為主 · 大局觀

免費、可本地運行的香港視角每日新聞 digest：**港聞 10 + 國際 10**，含宏觀引言、當日主線、大局觀思考題、逐則概要／宏觀分析，以及 20 則因果**閉環總結**。

不收費、不需登入、不依賴付費新聞 API。公開 RSS + 啟發式繁中寫手為預設；可選 OpenAI 相容／Ollama 加強文筆。

## 快速開始

```bash
npm install
npm run digest:seed   # 寫入演示報告（可選）
npm run dev           # http://localhost:3457
```

瀏覽：

- `/` 最新報告預覽
- `/history` 本地歷史
- `GET /api/digest` 最新 JSON
- `POST /api/digest/generate` 重新生成（body 可選 `{ "forceSeed": true }`）
- `GET /api/digest/export?format=md` 匯出 Markdown
- `GET /api/health` RSS／寫手狀態

CLI（方便系統 cron，零月費）：

```bash
npm run digest        # RSS + 啟發式（或 LLM）
npm run digest:seed   # 強制種子
```

## 可選 LLM（非必需）

```bash
export LLM_API_KEY=...          # 或 OPENAI_API_KEY
export LLM_BASE_URL=https://api.openai.com/v1   # 或 Ollama: http://127.0.0.1:11434/v1
export LLM_MODEL=gpt-4o-mini
```

無 key 時自動使用 `heuristic` 寫手，報告仍完整。

## 架構摘要

管線：`ingest → normalize → score → diversify → themes → draft/weave → validate → persist`

- 來源設定：[`config/sources.json`](config/sources.json)
- 選題憲章：[`src/lib/policy/editorial.ts`](src/lib/policy/editorial.ts)
- 產出：`data/latest-digest.json`、`data/history/YYYY-MM-DD.json`

## 免責

本工具只做宏觀閱讀與教育用途，**不構成投資建議**。
