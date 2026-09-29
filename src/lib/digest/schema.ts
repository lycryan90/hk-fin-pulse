import { z } from "zod";
import { DEFAULT_LOCALE } from "@/lib/locale/types";

export const ThemeIdSchema = z.enum([
  "fed_rates",
  "oil_geopolitics",
  "hk_liquidity",
  "regulation",
  "cny_crossborder",
  "asia_fx",
  "domestic_demand",
  "digital_policy",
  "other",
]);

export type ThemeId = z.infer<typeof ThemeIdSchema>;

export const CategorySchema = z.enum([
  "finance",
  "geopolitics",
  "government",
  "society",
  "other",
]);

export type NewsCategory = z.infer<typeof CategorySchema>;

export const LocaleSchema = z.enum(["zh-HK", "en-GB"]);

export const DigestItemSchema = z.object({
  id: z.string(),
  region: z.enum(["hk", "intl"]),
  category: CategorySchema,
  source: z.string(),
  sourceUrl: z.string().optional(),
  title: z.string(),
  summary: z.string(),
  macroAnalysis: z.string(),
  civilianLine: z.string().optional(),
  themeIds: z.array(ThemeIdSchema).optional(),
});

export type DigestItem = z.infer<typeof DigestItemSchema>;

export const DigestSchema = z.object({
  date: z.string(),
  createdAt: z.string(),
  locale: LocaleSchema.default(DEFAULT_LOCALE),
  label: z.string(),
  themes: z.array(
    z.object({
      id: ThemeIdSchema,
      label: z.string(),
    }),
  ),
  macroIntro: z.string(),
  thinkingQuestions: z.array(z.string()).min(3).max(3),
  hkItems: z.array(DigestItemSchema).length(10),
  intlItems: z.array(DigestItemSchema).length(10),
  closedLoopSummary: z.string(),
  meta: z.object({
    writerMode: z.enum(["heuristic", "llm-assisted", "seed"]),
    ingestStats: z.object({
      fetched: z.number(),
      used: z.number(),
      seedFilled: z.number(),
    }),
    generatedAt: z.string(),
  }),
});

export type Digest = z.infer<typeof DigestSchema>;

export type RawArticle = {
  title: string;
  summary: string;
  link?: string;
  source: string;
  publishedAt?: string;
  regionHint: "hk" | "intl" | "unknown";
};

export type ScoredArticle = RawArticle & {
  score: number;
  category: NewsCategory;
  region: "hk" | "intl";
  themeIds: ThemeId[];
};
