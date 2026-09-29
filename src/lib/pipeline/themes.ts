import type { ScoredArticle, ThemeId } from "@/lib/digest/schema";
import { THEME_LABELS_I18N } from "@/lib/locale/labels";
import type { DigestLocale } from "@/lib/locale/types";

export type DigestTheme = { id: ThemeId; label: string };

export function extractThemes(
  hk: ScoredArticle[],
  intl: ScoredArticle[],
  locale: DigestLocale = "zh-HK",
): DigestTheme[] {
  const labels = THEME_LABELS_I18N[locale];
  const counts = new Map<ThemeId, number>();
  for (const a of [...hk, ...intl]) {
    for (const t of a.themeIds) {
      counts.set(t, (counts.get(t) ?? 0) + 1);
    }
  }
  const ranked = [...counts.entries()]
    .filter(([id]) => id !== "other")
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([id]) => ({ id, label: labels[id] }));

  if (ranked.length < 2) {
    const fallback: ThemeId[] = ["fed_rates", "oil_geopolitics", "hk_liquidity"];
    for (const id of fallback) {
      if (!ranked.some((t) => t.id === id)) {
        ranked.push({ id, label: labels[id] });
      }
      if (ranked.length >= 3) break;
    }
  }
  return ranked.slice(0, 5);
}
