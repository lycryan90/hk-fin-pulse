import { z } from "zod";
import { LocaleSchema } from "@/lib/digest/schema";

export const SectorRotationSchema = z.object({
  theme: z.string(),
  observation: z.string(),
  implication: z.string(),
  relatedSectors: z.array(z.string()).min(1).max(6),
});

export const OutlookBlockSchema = z.object({
  headline: z.string(),
  analysis: z.string(),
});

export const WeeklyOutlookSchema = z.object({
  weekOf: z.string(),
  createdAt: z.string(),
  locale: LocaleSchema,
  title: z.string(),
  executiveSummary: z.string(),
  geopolitics: OutlookBlockSchema,
  financeCurrency: OutlookBlockSchema,
  chinaHongKong: OutlookBlockSchema,
  sectorRotation: z.array(SectorRotationSchema).min(3).max(8),
  watchlist: z.array(z.string()).min(3).max(6),
  closingNote: z.string(),
  meta: z.object({
    writerMode: z.enum(["llm-assisted", "heuristic"]),
    model: z.string().optional(),
    sourceDigestDates: z.array(z.string()),
    headlineCount: z.number(),
    generatedAt: z.string(),
  }),
});

export type WeeklyOutlook = z.infer<typeof WeeklyOutlookSchema>;
export type SectorRotation = z.infer<typeof SectorRotationSchema>;
