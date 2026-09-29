import type { Digest } from "@/lib/digest/schema";

export function digestToMarkdown(digest: Digest): string {
  const lines: string[] = [];
  lines.push(`# ${digest.date}`);
  lines.push(`港聞 10 · 國際 10 · ${digest.label}`);
  lines.push("");
  lines.push(`**當日主線**：${digest.themes.map((t) => t.label).join(" · ")}`);
  lines.push("");
  lines.push("## 宏觀引言");
  lines.push(digest.macroIntro);
  lines.push("");
  lines.push("## 大局觀思考題");
  digest.thinkingQuestions.forEach((q, i) => lines.push(`${i + 1}. ${q}`));
  lines.push("");
  lines.push("## 香港十則");
  for (const item of digest.hkItems) {
    lines.push(`### ${item.id} · ${item.category} · ${item.source}`);
    lines.push(`**〔${item.title.replace(/^[〔\[]|[〕\]]$/g, "")}〕**`);
    if (item.sourceUrl) lines.push(`來源連結：${item.sourceUrl}`);
    lines.push("");
    lines.push(item.summary);
    lines.push("");
    lines.push(`> 宏觀分析：${item.macroAnalysis}`);
    if (item.civilianLine) lines.push(`> 民生：${item.civilianLine}`);
    lines.push("");
  }
  lines.push("## 國際十則");
  for (const item of digest.intlItems) {
    lines.push(`### ${item.id} · ${item.category} · ${item.source}`);
    lines.push(`**〔${item.title.replace(/^[〔\[]|[〕\]]$/g, "")}〕**`);
    if (item.sourceUrl) lines.push(`來源連結：${item.sourceUrl}`);
    lines.push("");
    lines.push(item.summary);
    lines.push("");
    lines.push(`> 宏觀分析：${item.macroAnalysis}`);
    if (item.civilianLine) lines.push(`> 民生：${item.civilianLine}`);
    lines.push("");
  }
  lines.push("## 閉環總結");
  lines.push(digest.closedLoopSummary);
  lines.push("");
  lines.push(
    `---\n預覽由 digest API 產生 · createdAt ${digest.createdAt} · mode ${digest.meta.writerMode}`,
  );
  return lines.join("\n");
}
