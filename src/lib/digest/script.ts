import type { Digest } from "@/lib/digest/schema";
import { UI } from "@/lib/locale/labels";
import type { DigestLocale } from "@/lib/locale/types";

/** Build a single narration script for Web Speech API. */
export function buildReadAloudScript(digest: Digest): string {
  const locale = (digest.locale ?? "zh-HK") as DigestLocale;
  const t = UI[locale];
  const parts: string[] = [];

  parts.push(`${digest.label}. ${digest.date}.`);
  parts.push(
    locale === "en-GB"
      ? `Today's themes: ${digest.themes.map((x) => x.label).join("; ")}.`
      : `當日主線：${digest.themes.map((x) => x.label).join("、")}。`,
  );
  parts.push(`${t.macroIntro}. ${digest.macroIntro}`);
  parts.push(`${t.thinking}.`);
  digest.thinkingQuestions.forEach((q, i) => parts.push(`${i + 1}. ${q}`));
  parts.push(`${t.hkSection}.`);
  for (const item of digest.hkItems) {
    parts.push(`${item.id}. ${item.title}. ${item.summary} ${item.macroAnalysis}`);
  }
  parts.push(`${t.intlSection}.`);
  for (const item of digest.intlItems) {
    parts.push(`${item.id}. ${item.title}. ${item.summary} ${item.macroAnalysis}`);
  }
  parts.push(`${t.closedLoop}. ${digest.closedLoopSummary}`);
  return parts.join("\n");
}
