import { promises as fs } from "fs";
import path from "path";
import { WeeklyOutlookSchema, type WeeklyOutlook } from "@/lib/outlook/schema";

const DATA_DIR = path.join(process.cwd(), "data");
const LATEST_PATH = path.join(DATA_DIR, "latest-outlook.json");
const HISTORY_DIR = path.join(DATA_DIR, "outlook-history");

async function ensureDirs() {
  await fs.mkdir(HISTORY_DIR, { recursive: true });
}

export async function readLatestOutlook(): Promise<WeeklyOutlook | null> {
  try {
    const raw = await fs.readFile(LATEST_PATH, "utf8");
    return WeeklyOutlookSchema.parse(JSON.parse(raw));
  } catch {
    return null;
  }
}

export async function writeOutlook(outlook: WeeklyOutlook): Promise<void> {
  await ensureDirs();
  const parsed = WeeklyOutlookSchema.parse(outlook);
  const json = JSON.stringify(parsed, null, 2);
  await fs.writeFile(LATEST_PATH, json, "utf8");
  await fs.writeFile(path.join(HISTORY_DIR, `${parsed.weekOf}.json`), json, "utf8");
}

export async function listOutlookWeeks(): Promise<string[]> {
  await ensureDirs();
  const files = await fs.readdir(HISTORY_DIR);
  return files
    .filter((f) => f.endsWith(".json"))
    .map((f) => f.replace(/\.json$/, ""))
    .sort()
    .reverse();
}

export async function readOutlookWeek(weekOf: string): Promise<WeeklyOutlook | null> {
  try {
    const raw = await fs.readFile(path.join(HISTORY_DIR, `${weekOf}.json`), "utf8");
    return WeeklyOutlookSchema.parse(JSON.parse(raw));
  } catch {
    return null;
  }
}
