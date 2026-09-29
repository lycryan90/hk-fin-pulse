# 聽為主 · 大局觀（hk-fin-pulse）

免費、可本地運行的香港視角每日新聞 digest：**港聞 10 + 國際 10**，含宏觀引言、當日主線、**與昨日對照**、大局觀思考題、逐則概要／宏觀分析，以及 20 則因果**閉環總結**。

不收費、不需登入、不依賴付費新聞 API。公開 RSS + 啟發式繁中寫手為預設；可選 OpenAI 相容／Ollama 加強文筆。

## 快速開始

```bash
npm install
npm run digest:seed   # 寫入演示報告（可選）
npm run digest        # 抓取 RSS 並生成
npm run dev           # http://localhost:3457
```

瀏覽：

- `/` 最新報告預覽（含昨日對照、免責聲明）
- `/history` 本地歷史
- `GET /api/digest` 最新 JSON
- `GET /api/digest/diff` 與昨日主線／閉環對照
- `POST /api/digest/generate` 重新生成（body 可選 `{ "forceSeed": true }`）
- `GET /api/digest/export?format=md` 匯出 Markdown（頂部含免責）
- `GET /api/health` RSS／寫手狀態

## 每日自動生成（本機 cron，零月費）

```bash
npm run cron:install   # 預設每日 07:00 執行 npm run digest
npm run cron:remove    # 移除
```

日誌寫入 `data/logs/cron-digest.log`。亦可手動：

```bash
0 7 * * * cd /path/to/hk-fin-pulse && npm run digest >> data/logs/cron-digest.log 2>&1
```

## 可選 LLM（非必需）

複製 `.env.example` 為 `.env` 後填入：

```bash
cp .env.example .env
# LLM_API_KEY=...
# LLM_BASE_URL=https://api.openai.com/v1   # 或 Ollama: http://127.0.0.1:11434/v1
# LLM_API_KEY=ollama                      # Ollama 常用占位
# LLM_MODEL=gpt-4o-mini                   # 或 llama3.2
# LLM_ENABLED=false                       # 強制關閉 LLM
```

CLI 與 API 會自動讀取 `.env`／`.env.local`。無 key 或呼叫失敗時回退 `heuristic`，報告仍完整。`GET /api/health` 可查看 LLM 設定摘要。

## 新聞來源

見 [`config/sources.json`](config/sources.json)：RTHK（本地／大中華／國際）、Google News（港股金融、金管局／HIBOR、監管）、Guardian／NPR 等。可自行增刪，無需付費 API。

## 架構摘要

管線：`ingest → normalize → score → diversify → themes → draft/weave → validate → persist`

- 選題憲章：[`src/lib/policy/editorial.ts`](src/lib/policy/editorial.ts)
- 昨日對照：[`src/lib/digest/compare.ts`](src/lib/digest/compare.ts)
- 產出：`data/latest-digest.json`、`data/history/YYYY-MM-DD.json`

## 免責

本工具只做宏觀閱讀與教育用途，**不構成投資建議**。報告頁頂、頁尾與 Markdown 匯出均附免責聲明。
