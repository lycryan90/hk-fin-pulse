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
  const cur = new Set(current.themes.map((t) => t.label));
  const prev = new Set(previous.themes.map((t) => t.label));
  const addedThemes = [...cur].filter((t) => !prev.has(t));
  const removedThemes = [...prev].filter((t) => !cur.has(t));
  const stayedThemes = [...cur].filter((t) => prev.has(t));

  const closedLoopShift = summariseClosedLoopShift(
    previous.closedLoopSummary,
    current.closedLoopSummary,
  );

  const parts: string[] = [];
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

function summariseClosedLoopShift(prev: string, cur: string): string {
  const prevKeys = extractFocusWords(prev);
  const curKeys = extractFocusWords(cur);
  const gained = curKeys.filter((k) => !prevKeys.includes(k)).slice(0, 3);
  const lost = prevKeys.filter((k) => !curKeys.includes(k)).slice(0, 3);
  if (!gained.length && !lost.length) {
    return "閉環敘事重心變化不大，仍圍繞利率、資金與風險偏好";
  }
  const bits: string[] = ["閉環敘事"];
  if (gained.length) bits.push(`更強調${gained.join("、")}`);
  if (lost.length) bits.push(`較少提及${lost.join("、")}`);
  return bits.join("，");
}

const FOCUS = [
  "利率",
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

function extractFocusWords(text: string): string[] {
  return FOCUS.filter((w) => text.includes(w));
}

export async function diffAgainstPrevious(
  current: Digest,
): Promise<DayOverDayDiff | null> {
  const previous = await findPreviousDigest(current.date);
  if (!previous) return null;
  return compareDigests(current, previous);
}
