import { listHistoryDates, readHistoryDigest } from "@/lib/digest/store";
import { ingestArticles } from "@/lib/pipeline/ingest";
import { normalizeArticles } from "@/lib/pipeline/normalize";
import { scoreArticles } from "@/lib/pipeline/score";
import { format, previousFriday, isFriday } from "date-fns";

export type OutlookContext = {
  weekOf: string;
  sourceDigestDates: string[];
  digests: {
    date: string;
    themes: string[];
    macroIntro: string;
    closedLoopSummary: string;
    titles: string[];
  }[];
  freshHeadlines: { title: string; source: string; region: string }[];
};

export function resolveWeekOf(now = new Date()): string {
  const friday = isFriday(now) ? now : previousFriday(now);
  return format(friday, "yyyy-MM-dd");
}

export async function gatherOutlookContext(
  weekOf = resolveWeekOf(),
): Promise<OutlookContext> {
  const dates = await listHistoryDates();
  // Prefer latest digests (past week of material), not only dates ≤ weekOf label.
  const recent = dates.slice(0, 7);
  const digests = [];
  for (const date of recent) {
    const d = await readHistoryDigest(date);
    if (!d) continue;
    digests.push({
      date: d.date,
      themes: d.themes.map((t) => t.label),
      macroIntro: d.macroIntro,
      closedLoopSummary: d.closedLoopSummary,
      titles: [...d.hkItems, ...d.intlItems].map((i) => i.title).slice(0, 12),
    });
  }

  let freshHeadlines: OutlookContext["freshHeadlines"] = [];
  try {
    const ingested = await ingestArticles();
    const scored = scoreArticles(normalizeArticles(ingested.articles))
      .slice(0, 40)
      .map((a) => ({
        title: a.title,
        source: a.source,
        region: a.region,
      }));
    freshHeadlines = scored;
  } catch {
    freshHeadlines = [];
  }

  return {
    weekOf,
    sourceDigestDates: digests.map((d) => d.date),
    digests,
    freshHeadlines,
  };
}
