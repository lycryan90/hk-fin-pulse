/** Count characters for Traditional Chinese copy (codepoints, ignore whitespace). */
export function countZhChars(text: string): number {
  return [...text.replace(/\s+/g, "")].length;
}

/** Trim to max chars at a sentence boundary when possible. */
export function clampZh(text: string, min: number, max: number): string {
  const cleaned = text.replace(/\s+/g, " ").trim();
  const chars = [...cleaned];
  if (chars.length <= max && chars.length >= min) return cleaned;
  if (chars.length > max) {
    const slice = chars.slice(0, max).join("");
    const punct = Math.max(
      slice.lastIndexOf("。"),
      slice.lastIndexOf("；"),
      slice.lastIndexOf("，"),
    );
    if (punct >= min - 5) return slice.slice(0, punct + 1);
    return slice.replace(/[，、；：\s]+$/u, "") + "。";
  }
  return cleaned;
}

export function inRange(text: string, min: number, max: number): boolean {
  const n = countZhChars(text);
  return n >= min && n <= max;
}
