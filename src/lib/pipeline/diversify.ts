import type { RawArticle, ScoredArticle } from "@/lib/digest/schema";
import { MAX_PER_THEME } from "@/lib/policy/editorial";
import { SEED_RAW_HK, SEED_RAW_INTL } from "@/lib/news/seed-raw";
import { scoreArticles } from "@/lib/pipeline/score";

function bigramSet(text: string): Set<string> {
  const s = text.replace(/\s+/g, "");
  const set = new Set<string>();
  for (let i = 0; i < s.length - 1; i++) set.add(s.slice(i, i + 2));
  return set;
}

function jaccard(a: string, b: string): number {
  const A = bigramSet(a);
  const B = bigramSet(b);
  if (A.size === 0 || B.size === 0) return 0;
  let inter = 0;
  for (const x of A) if (B.has(x)) inter++;
  return inter / (A.size + B.size - inter);
}

function isNearDuplicate(candidate: string, accepted: string[]): boolean {
  return accepted.some((t) => jaccard(candidate, t) > 0.45);
}

function pickRegion(
  pool: ScoredArticle[],
  limit: number,
): { picked: ScoredArticle[]; usedTitles: string[] } {
  const themeCount = new Map<string, number>();
  const picked: ScoredArticle[] = [];
  const usedTitles: string[] = [];

  for (const article of pool) {
    if (picked.length >= limit) break;
    if (isNearDuplicate(article.title, usedTitles)) continue;
    const primary = article.themeIds[0] ?? "other";
    const count = themeCount.get(primary) ?? 0;
    if (count >= MAX_PER_THEME) continue;
    themeCount.set(primary, count + 1);
    picked.push(article);
    usedTitles.push(article.title);
  }

  // Second pass: relax theme cap if still short
  if (picked.length < limit) {
    for (const article of pool) {
      if (picked.length >= limit) break;
      if (picked.some((p) => p.title === article.title)) continue;
      if (isNearDuplicate(article.title, usedTitles)) continue;
      picked.push(article);
      usedTitles.push(article.title);
    }
  }

  return { picked, usedTitles };
}

export type DiversifyResult = {
  hk: ScoredArticle[];
  intl: ScoredArticle[];
  seedFilled: number;
};

export function diversifyPick(
  scored: ScoredArticle[],
  seedRaw?: { hk: RawArticle[]; intl: RawArticle[] },
): DiversifyResult {
  const hkPool = scored.filter((a) => a.region === "hk");
  const intlPool = scored.filter((a) => a.region === "intl");

  let { picked: hk } = pickRegion(hkPool, 10);
  let { picked: intl } = pickRegion(intlPool, 10);
  let seedFilled = 0;

  const seedHk = scoreArticles(seedRaw?.hk ?? SEED_RAW_HK);
  const seedIntl = scoreArticles(seedRaw?.intl ?? SEED_RAW_INTL);

  const fill = (
    current: ScoredArticle[],
    seeds: ScoredArticle[],
  ): ScoredArticle[] => {
    const titles = current.map((c) => c.title);
    const out = [...current];
    for (const s of seeds) {
      if (out.length >= 10) break;
      if (isNearDuplicate(s.title, titles)) continue;
      out.push(s);
      titles.push(s.title);
      seedFilled++;
    }
    return out.slice(0, 10);
  };

  if (hk.length < 10) hk = fill(hk, seedHk);
  if (intl.length < 10) intl = fill(intl, seedIntl);

  return { hk, intl, seedFilled };
}
