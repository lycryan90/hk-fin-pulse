import { promises as fs } from "fs";
import path from "path";
import { DigestSchema, type Digest } from "@/lib/digest/schema";
import { DEFAULT_LOCALE } from "@/lib/locale/types";
import { PRODUCT_LABEL } from "@/lib/locale/labels";

const DATA_DIR = path.join(process.cwd(), "data");
const LATEST_PATH = path.join(DATA_DIR, "latest-digest.json");
const HISTORY_DIR = path.join(DATA_DIR, "history");

async function ensureDirs() {
  await fs.mkdir(HISTORY_DIR, { recursive: true });
}

function migrate(raw: unknown): Digest {
  const obj = raw as Record<string, unknown>;
  if (!obj.locale) obj.locale = DEFAULT_LOCALE;
  if (!obj.label) {
    obj.label = PRODUCT_LABEL[(obj.locale as "zh-HK" | "en-GB") ?? DEFAULT_LOCALE];
  }
  return DigestSchema.parse(obj);
}

export async function readLatestDigest(): Promise<Digest | null> {
  try {
    const raw = await fs.readFile(LATEST_PATH, "utf8");
    return migrate(JSON.parse(raw));
  } catch {
    return null;
  }
}

export async function writeDigest(digest: Digest): Promise<void> {
  await ensureDirs();
  const parsed = DigestSchema.parse(digest);
  const json = JSON.stringify(parsed, null, 2);
  await fs.writeFile(LATEST_PATH, json, "utf8");
  await fs.writeFile(path.join(HISTORY_DIR, `${parsed.date}.json`), json, "utf8");
}

export async function listHistoryDates(): Promise<string[]> {
  await ensureDirs();
  const files = await fs.readdir(HISTORY_DIR);
  return files
    .filter((f) => f.endsWith(".json"))
    .map((f) => f.replace(/\.json$/, ""))
    .sort()
    .reverse();
}

export async function readHistoryDigest(date: string): Promise<Digest | null> {
  try {
    const raw = await fs.readFile(path.join(HISTORY_DIR, `${date}.json`), "utf8");
    return migrate(JSON.parse(raw));
  } catch {
    return null;
  }
}
