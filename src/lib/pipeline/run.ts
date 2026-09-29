import { format } from "date-fns";
import type { Digest } from "@/lib/digest/schema";
import { writeDigest } from "@/lib/digest/store";
import { PRODUCT_LABEL } from "@/lib/locale/labels";
import { DEFAULT_LOCALE, type DigestLocale } from "@/lib/locale/types";
import { diversifyPick } from "@/lib/pipeline/diversify";
import { ingestArticles } from "@/lib/pipeline/ingest";
import { normalizeArticles } from "@/lib/pipeline/normalize";
import { scoreArticles } from "@/lib/pipeline/score";
import { extractThemes } from "@/lib/pipeline/themes";
import { validateDigest } from "@/lib/pipeline/validate";
import { SEED_RAW_HK, SEED_RAW_INTL } from "@/lib/news/seed-raw";
import { writeDigestCopy } from "@/lib/writer/llm";
import {
  draftAllItems,
  weaveClosedLoop,
  weaveMacroIntro,
  weaveThinkingQuestions,
} from "@/lib/writer/heuristic";

export type GenerateOptions = {
  forceSeed?: boolean;
  locale?: DigestLocale;
};

export async function generateDigest(
  options: GenerateOptions = {},
): Promise<Digest> {
  const locale = options.locale ?? DEFAULT_LOCALE;
  const now = new Date();
  const date = format(now, "yyyy-MM-dd");
  const createdAt = now.toISOString();

  if (options.forceSeed) {
    return buildFromSeedOnly(date, createdAt, locale);
  }

  const ingested = await ingestArticles();
  const normalized = normalizeArticles(ingested.articles);
  const scored = scoreArticles(normalized);
  const { hk, intl, seedFilled } = diversifyPick(scored);
  const themes = extractThemes(hk, intl, locale);
  const copy = await writeDigestCopy(hk, intl, themes, locale);

  const digest = validateDigest({
    date,
    createdAt,
    locale,
    label: PRODUCT_LABEL[locale],
    themes,
    macroIntro: copy.macroIntro,
    thinkingQuestions: copy.thinkingQuestions,
    hkItems: copy.hkItems,
    intlItems: copy.intlItems,
    closedLoopSummary: copy.closedLoopSummary,
    meta: {
      writerMode: copy.writerMode,
      ingestStats: {
        fetched: ingested.fetched,
        used: 20 - seedFilled,
        seedFilled,
      },
      generatedAt: createdAt,
    },
  });

  await writeDigest(digest);
  return digest;
}

async function buildFromSeedOnly(
  date: string,
  createdAt: string,
  locale: DigestLocale,
): Promise<Digest> {
  const hk = scoreArticles(SEED_RAW_HK).slice(0, 10);
  const intl = scoreArticles(SEED_RAW_INTL).slice(0, 10);
  const themes = extractThemes(hk, intl, locale);
  const items = draftAllItems(hk, intl, locale);
  const digest = validateDigest({
    date,
    createdAt,
    locale,
    label: PRODUCT_LABEL[locale],
    themes,
    macroIntro: weaveMacroIntro(themes, items.hkItems, items.intlItems, locale),
    thinkingQuestions: weaveThinkingQuestions(themes, locale),
    hkItems: items.hkItems,
    intlItems: items.intlItems,
    closedLoopSummary: weaveClosedLoop(
      themes,
      items.hkItems,
      items.intlItems,
      locale,
    ),
    meta: {
      writerMode: "seed",
      ingestStats: { fetched: 0, used: 0, seedFilled: 20 },
      generatedAt: createdAt,
    },
  });
  await writeDigest(digest);
  return digest;
}

export async function ensureSeedDigest(
  locale: DigestLocale = DEFAULT_LOCALE,
): Promise<Digest> {
  const { readLatestDigest } = await import("@/lib/digest/store");
  const existing = await readLatestDigest();
  if (existing) return existing;
  return generateDigest({ forceSeed: true, locale });
}
