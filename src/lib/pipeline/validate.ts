import { clampZh, countZhChars, inRange } from "@/lib/digest/chars";
import type { Digest, DigestItem } from "@/lib/digest/schema";
import { DigestSchema } from "@/lib/digest/schema";
import { TRANSMISSION_WORDS } from "@/lib/policy/editorial";

function fixItem(item: DigestItem): DigestItem {
  let summary = clampZh(item.summary, 80, 100);
  let macroAnalysis = clampZh(item.macroAnalysis, 80, 100);
  if (!TRANSMISSION_WORDS.some((w) => macroAnalysis.includes(w))) {
    macroAnalysis = clampZh(
      `${macroAnalysis}這影響香港資金成本與普通人風險承受能力。`,
      80,
      100,
    );
  }
  if (!inRange(summary, 80, 110)) {
    summary = clampZh(
      `${summary}市場正重新評估利率、流動性與風險偏好的相對吸引力。`,
      80,
      100,
    );
  }
  const civilianLine = item.civilianLine
    ? clampZh(item.civilianLine, 12, 40)
    : undefined;
  return { ...item, summary, macroAnalysis, civilianLine };
}

function dedupeOpenings(items: DigestItem[]): DigestItem[] {
  const seen = new Set<string>();
  return items.map((item, idx) => {
    const opening = item.macroAnalysis.slice(0, 20);
    if (!seen.has(opening)) {
      seen.add(opening);
      return item;
    }
    const alt = clampZh(
      `換個角度看，${item.macroAnalysis}（視角${idx + 1}）`.replace("（視角", "。資金與"),
      80,
      100,
    );
    // simpler unique prefix
    const prefixed = clampZh(
      `${["此外", "與此同時", "進一步看", "值得注意", "另一層面"][idx % 5]}，${item.macroAnalysis}`,
      80,
      100,
    );
    seen.add(prefixed.slice(0, 20));
    return { ...item, macroAnalysis: prefixed || alt };
  });
}

export function validateDigest(input: Digest): Digest {
  const hkItems = dedupeOpenings(input.hkItems.map(fixItem));
  const intlItems = dedupeOpenings(input.intlItems.map(fixItem));
  const macroIntro = clampZh(input.macroIntro, 150, 250);
  const closedLoopSummary = clampZh(input.closedLoopSummary, 150, 250);
  const thinkingQuestions = input.thinkingQuestions.slice(0, 3);
  while (thinkingQuestions.length < 3) {
    thinkingQuestions.push(
      "在當前宏觀不確定性下，普通人應如何理解借貸成本與資產波動？",
    );
  }

  const digest: Digest = {
    ...input,
    macroIntro,
    closedLoopSummary,
    thinkingQuestions,
    hkItems,
    intlItems,
  };

  // Soft checks — still parse
  for (const item of [...hkItems, ...intlItems]) {
    if (countZhChars(item.summary) < 60) {
      throw new Error(`摘要過短：${item.id}`);
    }
  }

  return DigestSchema.parse(digest);
}
