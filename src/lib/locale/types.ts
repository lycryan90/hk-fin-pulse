export type DigestLocale = "zh-HK" | "en-GB";

export const DEFAULT_LOCALE: DigestLocale = "zh-HK";

export function isDigestLocale(value: unknown): value is DigestLocale {
  return value === "zh-HK" || value === "en-GB";
}

export function speechLang(locale: DigestLocale): string {
  return locale === "en-GB" ? "en-GB" : "zh-HK";
}
