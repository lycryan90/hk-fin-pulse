import type { RawArticle, ScoredArticle } from "@/lib/digest/schema";
import {
  inferCategory,
  inferRegion,
  inferThemes,
  scoreArticle,
} from "@/lib/policy/editorial";

export function scoreArticles(articles: RawArticle[]): ScoredArticle[] {
  return articles
    .map((a) => {
      const text = `${a.title} ${a.summary}`;
      const themeIds = inferThemes(text);
      const region = inferRegion(a.title, a.summary, a.regionHint);
      const category = inferCategory(text, themeIds);
      const score = scoreArticle(a.title, a.summary);
      return { ...a, score, category, region, themeIds };
    })
    .filter((a) => a.score > 0)
    .sort((a, b) => b.score - a.score);
}
