import { promises as fs } from "fs";
import path from "path";
import Parser from "rss-parser";
import type { RawArticle } from "@/lib/digest/schema";

type SourceConfig = {
  name: string;
  url: string;
  weight: number;
};

type SourcesFile = {
  hk: SourceConfig[];
  intl: SourceConfig[];
};

const parser = new Parser({
  headers: {
    "User-Agent": "HKBigPictureDigest/1.0 (+local; free RSS reader)",
    Accept: "application/rss+xml, application/xml, text/xml, */*",
  },
});

const FEED_TIMEOUT_MS = 5000;

async function loadSources(): Promise<SourcesFile> {
  const file = path.join(process.cwd(), "config", "sources.json");
  const raw = await fs.readFile(file, "utf8");
  return JSON.parse(raw) as SourcesFile;
}

function stripHtml(input: string): string {
  return input.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

async function fetchWithTimeout(url: string): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FEED_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "HKBigPictureDigest/1.0 (+local; free RSS reader)",
        Accept: "application/rss+xml, application/xml, text/xml, */*",
      },
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.text();
  } finally {
    clearTimeout(timer);
  }
}

async function fetchFeed(
  source: SourceConfig,
  regionHint: "hk" | "intl",
): Promise<RawArticle[]> {
  try {
    const xml = await fetchWithTimeout(source.url);
    const feed = await parser.parseString(xml);
    return (feed.items ?? []).slice(0, 25).map((item) => ({
      title: stripHtml(item.title ?? "無標題"),
      summary: stripHtml(item.contentSnippet ?? item.content ?? item.summary ?? ""),
      link: item.link,
      source: source.name,
      publishedAt: item.isoDate ?? item.pubDate,
      regionHint,
    }));
  } catch {
    return [];
  }
}

export type IngestResult = {
  articles: RawArticle[];
  fetched: number;
  sourceErrors: string[];
};

export async function ingestArticles(): Promise<IngestResult> {
  const sources = await loadSources();
  const sourceErrors: string[] = [];
  const articles: RawArticle[] = [];

  const jobs = [
    ...sources.hk.map(async (s) => {
      const items = await fetchFeed(s, "hk");
      if (items.length === 0) sourceErrors.push(s.name);
      return items;
    }),
    ...sources.intl.map(async (s) => {
      const items = await fetchFeed(s, "intl");
      if (items.length === 0) sourceErrors.push(s.name);
      return items;
    }),
  ];

  const batches = await Promise.all(jobs);
  for (const batch of batches) articles.push(...batch);

  return { articles, fetched: articles.length, sourceErrors };
}
