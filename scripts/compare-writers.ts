/**
 * Side-by-side heuristic vs LLM on the SAME selected articles.
 * Usage (env only — do not commit keys):
 *   LLM_API_KEY=... LLM_BASE_URL=... LLM_MODEL=... npx tsx scripts/compare-writers.ts
 */
import { promises as fs } from "fs";
import path from "path";
import { loadEnvFile } from "../src/lib/env";
import { diversifyPick } from "../src/lib/pipeline/diversify";
import { ingestArticles } from "../src/lib/pipeline/ingest";
import { normalizeArticles } from "../src/lib/pipeline/normalize";
import { scoreArticles } from "../src/lib/pipeline/score";
import { extractThemes } from "../src/lib/pipeline/themes";
import {
  draftAllItems,
  weaveClosedLoop,
  weaveMacroIntro,
  weaveThinkingQuestions,
} from "../src/lib/writer/heuristic";
import { writeDigestCopy } from "../src/lib/writer/llm";

async function main() {
  await loadEnvFile(".env");
  await loadEnvFile(".env.local");

  const outDir = path.join(process.cwd(), "data", "compare");
  await fs.mkdir(outDir, { recursive: true });

  const ingested = await ingestArticles();
  const normalized = normalizeArticles(ingested.articles);
  const scored = scoreArticles(normalized);
  const { hk, intl, seedFilled } = diversifyPick(scored);
  const themes = extractThemes(hk, intl, "zh-HK");

  const heuristicItems = draftAllItems(hk, intl, "zh-HK");
  const heuristic = {
    mode: "heuristic" as const,
    themes,
    macroIntro: weaveMacroIntro(
      themes,
      heuristicItems.hkItems,
      heuristicItems.intlItems,
      "zh-HK",
    ),
    thinkingQuestions: weaveThinkingQuestions(themes, "zh-HK"),
    closedLoopSummary: weaveClosedLoop(
      themes,
      heuristicItems.hkItems,
      heuristicItems.intlItems,
      "zh-HK",
    ),
    hkItems: heuristicItems.hkItems,
    intlItems: heuristicItems.intlItems,
    meta: { fetched: ingested.fetched, seedFilled },
  };

  const llm = await writeDigestCopy(hk, intl, themes, "zh-HK");

  await fs.writeFile(
    path.join(outDir, "heuristic-zh.json"),
    JSON.stringify(heuristic, null, 2),
    "utf8",
  );
  await fs.writeFile(
    path.join(outDir, "llm-zh.json"),
    JSON.stringify(
      {
        mode: llm.writerMode,
        llmNote: llm.llmNote,
        themes,
        macroIntro: llm.macroIntro,
        thinkingQuestions: llm.thinkingQuestions,
        closedLoopSummary: llm.closedLoopSummary,
        hkItems: llm.hkItems,
        intlItems: llm.intlItems,
        meta: { fetched: ingested.fetched, seedFilled },
      },
      null,
      2,
    ),
    "utf8",
  );

  // Build a short markdown report (first 3 HK + 2 INT samples)
  const samples = [
    ...heuristic.hkItems.slice(0, 3).map((_, i) => ({ side: "hk" as const, i })),
    ...heuristic.intlItems.slice(0, 2).map((_, i) => ({ side: "intl" as const, i })),
  ];

  const lines: string[] = [];
  lines.push("# 規則寫手 vs Gemini LLM 對比報告（港中）");
  lines.push("");
  lines.push(`- 同一批新聞：抓取 ${ingested.fetched} 則，種子補位 ${seedFilled}`);
  lines.push(`- 主線：${themes.map((t) => t.label).join(" · ")}`);
  lines.push(`- LLM 模式：${llm.writerMode}${llm.llmNote ? `（${llm.llmNote}）` : ""}`);
  lines.push(`- 模型／端點：${process.env.LLM_MODEL || "n/a"} @ ${process.env.LLM_BASE_URL || "n/a"}`);
  lines.push("");
  lines.push("## 總覽差異");
  lines.push("");
  lines.push("| 項目 | 規則寫手 | LLM |");
  lines.push("|---|---|---|");
  lines.push(
    `| 宏觀引言字數 | ${[...heuristic.macroIntro.replace(/\s/g, "")].length} | ${[...llm.macroIntro.replace(/\s/g, "")].length} |`,
  );
  lines.push(
    `| 閉環總結字數 | ${[...heuristic.closedLoopSummary.replace(/\s/g, "")].length} | ${[...llm.closedLoopSummary.replace(/\s/g, "")].length} |`,
  );
  lines.push(
    `| 引言是否較貼當日標題 | 以主題標籤串聯為主 | ${llm.writerMode === "llm-assisted" ? "通常較貼單則內容" : "未成功，已回退"} |`,
  );
  lines.push("");
  lines.push("## 宏觀引言對照");
  lines.push("");
  lines.push("### 規則寫手");
  lines.push(heuristic.macroIntro);
  lines.push("");
  lines.push("### LLM");
  lines.push(llm.macroIntro);
  lines.push("");
  lines.push("## 閉環總結對照");
  lines.push("");
  lines.push("### 規則寫手");
  lines.push(heuristic.closedLoopSummary);
  lines.push("");
  lines.push("### LLM");
  lines.push(llm.closedLoopSummary);
  lines.push("");
  lines.push("## 逐則抽樣（概要 + 宏觀分析）");
  lines.push("");

  for (const s of samples) {
    const h = s.side === "hk" ? heuristic.hkItems[s.i]! : heuristic.intlItems[s.i]!;
    const l = s.side === "hk" ? llm.hkItems[s.i]! : llm.intlItems[s.i]!;
    lines.push(`### ${h.id}｜來源題：${h.title}`);
    lines.push("");
    lines.push("**規則 · 概要**");
    lines.push(h.summary);
    lines.push("");
    lines.push("**LLM · 概要**");
    lines.push(l.summary);
    lines.push("");
    lines.push("**規則 · 宏觀分析**");
    lines.push(h.macroAnalysis);
    lines.push("");
    lines.push("**LLM · 宏觀分析**");
    lines.push(l.macroAnalysis);
    lines.push("");
  }

  lines.push("## 結論（簡）");
  lines.push("");
  if (llm.writerMode !== "llm-assisted") {
    lines.push("- 今次 LLM 未成功接管寫作，報告顯示已回退規則寫手；請檢查 key／模型／超時。");
  } else {
    lines.push("- **概要**：規則偏「主題句 + 固定收尾」；LLM 較多落到具體事件細節。");
    lines.push("- **宏觀分析**：規則用主題傳導模板（息口→按揭等）；LLM 較常結合該則事實再講香港影響。");
    lines.push("- **引言／閉環**：規則穩定但易重複；LLM 敘事較連貫，但仍需人工抽查事實。");
    lines.push("- **取捨**：日常可無 LLM；要接近人手簡報文筆時再開 Gemini。");
  }
  lines.push("");

  const reportPath = path.join(outDir, "writer-comparison-zh.md");
  await fs.writeFile(reportPath, lines.join("\n"), "utf8");
  console.log(
    JSON.stringify(
      {
        reportPath,
        heuristicMode: heuristic.mode,
        llmMode: llm.writerMode,
        llmNote: llm.llmNote,
        themes: themes.map((t) => t.label),
      },
      null,
      2,
    ),
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
