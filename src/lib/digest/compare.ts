import type { Digest } from "@/lib/digest/schema";
import { listHistoryDates, readHistoryDigest } from "@/lib/digest/store";

export type DayOverDayDiff = {
  previousDate: string;
  addedThemes: string[];
  removedThemes: string[];
  stayedThemes: string[];
  closedLoopShift: string;
  summary: string;
};

export async function findPreviousDigest(
  beforeDate: string,
): Promise<Digest | null> {
  const dates = await listHistoryDates();
  const older = dates.find((d) => d < beforeDate);
  if (!older) return null;
  return readHistoryDigest(older);
}

export function compareDigests(
  current: Digest,
  previous: Digest,
): DayOverDayDiff {
  const en = current.locale === "en-GB";
  const cur = new Set(current.themes.map((t) => t.label));
  const prev = new Set(previous.themes.map((t) => t.label));
  const addedThemes = [...cur].filter((t) => !prev.has(t));
  const removedThemes = [...prev].filter((t) => !cur.has(t));
  const stayedThemes = [...cur].filter((t) => prev.has(t));

  const closedLoopShift = summariseClosedLoopShift(
    previous.closedLoopSummary,
    current.closedLoopSummary,
    en,
  );

  const parts: string[] = [];
  if (en) {
    if (addedThemes.length) parts.push(`New themes: ${addedThemes.join("; ")}`);
    if (removedThemes.length) parts.push(`Faded: ${removedThemes.join("; ")}`);
    if (!addedThemes.length && !removedThemes.length) {
      parts.push(
        `Themes largely continue (${stayedThemes.slice(0, 3).join("; ") || "prior themes"})`,
      );
    }
    parts.push(closedLoopShift);
    return {
      previousDate: previous.date,
      addedThemes,
      removedThemes,
      stayedThemes,
      closedLoopShift,
      summary: parts.join(". ") + ".",
    };
  }

  if (addedThemes.length) parts.push(`新主線：${addedThemes.join("、")}`);
  if (removedThemes.length) parts.push(`淡出：${removedThemes.join("、")}`);
  if (!addedThemes.length && !removedThemes.length) {
    parts.push(`主線大致延續（${stayedThemes.slice(0, 3).join("、") || "既有主題"}）`);
  }
  parts.push(closedLoopShift);

  return {
    previousDate: previous.date,
    addedThemes,
    removedThemes,
    stayedThemes,
    closedLoopShift,
    summary: parts.join("。") + "。",
  };
}

function summariseClosedLoopShift(prev: string, cur: string, en: boolean): string {
  const prevKeys = extractFocusWords(prev);
  const curKeys = extractFocusWords(cur);
  const gained = curKeys.filter((k) => !prevKeys.includes(k)).slice(0, 3);
  const lost = prevKeys.filter((k) => !curKeys.includes(k)).slice(0, 3);
  if (en) {
    if (!gained.length && !lost.length) {
      return "Closed-loop emphasis is little changed, still around rates, funding and risk appetite";
    }
    const bits: string[] = ["Closed-loop narrative"];
    if (gained.length) bits.push(`leans more on ${gained.join(", ")}`);
    if (lost.length) bits.push(`mentions less of ${lost.join(", ")}`);
    return bits.join(", ");
  }
  if (!gained.length && !lost.length) {
    return "閉環敘事重心變化不大，仍圍繞利率、資金與風險偏好";
  }
  const bits: string[] = ["閉環敘事"];
  if (gained.length) bits.push(`更強調${gained.join("、")}`);
  if (lost.length) bits.push(`較少提及${lost.join("、")}`);
  return bits.join("，");
}

const FOCUS_ZH = [
  "利率",
  "息口",
  "通脹",
  "油價",
  "地緣",
  "監管",
  "加密",
  "人民幣",
  "匯市",
  "日圓",
  "樓市",
  "流動性",
  "避險",
  "就業",
  "債息",
  "科技股",
] as const;

const FOCUS_EN = [
  "rate",
  "inflation",
  "oil",
  "geopolit",
  "regulat",
  "crypto",
  "renminbi",
  "FX",
  "yen",
  "property",
  "liquidity",
  "haven",
  "payroll",
  "Treasury",
  "technology",
] as const;

function extractFocusWords(text: string): string[] {
  const lower = text.toLowerCase();
  const zh = FOCUS_ZH.filter((w) => text.includes(w));
  const en = FOCUS_EN.filter((w) => lower.includes(w.toLowerCase()));
  return [...zh, ...en];
}

export async function diffAgainstPrevious(
  current: Digest,
): Promise<DayOverDayDiff | null> {
  const previous = await findPreviousDigest(current.date);
  if (!previous) return null;
  return compareDigests(current, previous);
}
