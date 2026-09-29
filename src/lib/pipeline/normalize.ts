import type { RawArticle } from "@/lib/digest/schema";

export function normalizeArticles(articles: RawArticle[]): RawArticle[] {
  const seen = new Set<string>();
  const out: RawArticle[] = [];
  for (const a of articles) {
    const title = a.title.replace(/\s+/g, " ").trim();
    if (!title || title.length < 6) continue;
    const key = title.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({
      ...a,
      title,
      summary: (a.summary || "").replace(/\s+/g, " ").trim(),
    });
  }
  return out;
}
