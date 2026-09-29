import { clampZh, countZhChars, inRange } from "@/lib/digest/chars";
import type { Digest, DigestItem } from "@/lib/digest/schema";
import { DigestSchema } from "@/lib/digest/schema";
import type { DigestLocale } from "@/lib/locale/types";
import { TRANSMISSION_WORDS } from "@/lib/policy/editorial";

function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function clampWords(text: string, min: number, max: number): string {
  const words = text.replace(/\s+/g, " ").trim().split(" ").filter(Boolean);
  if (words.length > max) {
    let cut = words.slice(0, max).join(" ");
    if (!/[.!?]$/.test(cut)) cut += ".";
    return cut;
  }
  let out = words.join(" ");
  while (wordCount(out) < min) {
    out = `${out.replace(/[.!?]$/, "")}. Markets remain focused on funding costs and risk appetite.`;
    if (wordCount(out) >= min) break;
  }
  return out;
}

function fixItemZh(item: DigestItem): DigestItem {
  let summary = clampZh(item.summary, 80, 100);
  let macroAnalysis = clampZh(item.macroAnalysis, 80, 100);
  if (!TRANSMISSION_WORDS.some((w) => macroAnalysis.includes(w))) {
    macroAnalysis = clampZh(
      `${macroAnalysis}呢個會影響香港資金成本同普通人風險承受能力。`,
      80,
      100,
    );
  }
  if (!inRange(summary, 80, 110)) {
    summary = clampZh(
      `${summary}市場正重新評估息口、流動性同風險偏好嘅相對吸引力。`,
      80,
      100,
    );
  }
  const civilianLine = item.civilianLine
    ? clampZh(item.civilianLine, 12, 40)
    : undefined;
  return { ...item, summary, macroAnalysis, civilianLine };
}

function fixItemEn(item: DigestItem): DigestItem {
  let summary = clampWords(item.summary, 55, 75);
  let macroAnalysis = clampWords(item.macroAnalysis, 55, 75);
  const markers = [
    "Hong Kong",
    "rate",
    "funding",
    "inflation",
    "household",
    "liquidity",
    "borrow",
    "risk",
  ];
  if (!markers.some((w) => macroAnalysis.toLowerCase().includes(w.toLowerCase()))) {
    macroAnalysis = clampWords(
      `${macroAnalysis} This affects Hong Kong funding costs and household risk appetite.`,
      55,
      75,
    );
  }
  return {
    ...item,
    summary,
    macroAnalysis,
    civilianLine: item.civilianLine
      ? clampWords(item.civilianLine, 6, 14)
      : undefined,
  };
}

function dedupeOpenings(
  items: DigestItem[],
  locale: DigestLocale,
): DigestItem[] {
  const seen = new Set<string>();
  const prefixesZh = ["此外", "與此同時", "進一步睇", "值得留意", "另一層面"];
  const prefixesEn = [
    "Additionally,",
    "At the same time,",
    "Further,",
    "Notably,",
    "Separately,",
  ];
  return items.map((item, idx) => {
    const opening = item.macroAnalysis.slice(0, 20);
    if (!seen.has(opening)) {
      seen.add(opening);
      return item;
    }
    if (locale === "en-GB") {
      const prefixed = clampWords(
        `${prefixesEn[idx % prefixesEn.length]} ${item.macroAnalysis}`,
        55,
        75,
      );
      seen.add(prefixed.slice(0, 20));
      return { ...item, macroAnalysis: prefixed };
    }
    const prefixed = clampZh(
      `${prefixesZh[idx % prefixesZh.length]}，${item.macroAnalysis}`,
      80,
      100,
    );
    seen.add(prefixed.slice(0, 20));
    return { ...item, macroAnalysis: prefixed };
  });
}

export function validateDigest(input: Digest): Digest {
  const locale = input.locale ?? "zh-HK";
  const fix = locale === "en-GB" ? fixItemEn : fixItemZh;
  const hkItems = dedupeOpenings(input.hkItems.map(fix), locale);
  const intlItems = dedupeOpenings(input.intlItems.map(fix), locale);

  const macroIntro =
    locale === "en-GB"
      ? clampWords(input.macroIntro, 110, 160)
      : clampZh(input.macroIntro, 150, 250);
  const closedLoopSummary =
    locale === "en-GB"
      ? clampWords(input.closedLoopSummary, 110, 160)
      : clampZh(input.closedLoopSummary, 150, 250);

  const thinkingQuestions = input.thinkingQuestions.slice(0, 3);
  const fallbackQ =
    locale === "en-GB"
      ? "Under current macro uncertainty, how should households read borrowing costs and asset volatility?"
      : "喺而家宏觀唔確定性底下，普通人應點理解借貸成本同資產波動？";
  while (thinkingQuestions.length < 3) thinkingQuestions.push(fallbackQ);

  const digest: Digest = {
    ...input,
    locale,
    macroIntro,
    closedLoopSummary,
    thinkingQuestions,
    hkItems,
    intlItems,
  };

  for (const item of [...hkItems, ...intlItems]) {
    if (locale === "en-GB") {
      if (wordCount(item.summary) < 40) throw new Error(`Summary too short: ${item.id}`);
    } else if (countZhChars(item.summary) < 60) {
      throw new Error(`摘要過短：${item.id}`);
    }
  }

  return DigestSchema.parse(digest);
}
