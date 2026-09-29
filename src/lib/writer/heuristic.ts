import type { DigestItem, ScoredArticle } from "@/lib/digest/schema";
import type { DigestLocale } from "@/lib/locale/types";
import type { DigestTheme } from "@/lib/pipeline/themes";
import {
  draftAllItemsEn,
  weaveClosedLoopEn,
  weaveMacroIntroEn,
  weaveThinkingQuestionsEn,
} from "@/lib/writer/heuristic-en";
import {
  draftAllItemsZh,
  weaveClosedLoopZh,
  weaveMacroIntroZh,
  weaveThinkingQuestionsZh,
} from "@/lib/writer/heuristic-zh";

export function draftAllItems(
  hk: ScoredArticle[],
  intl: ScoredArticle[],
  locale: DigestLocale = "zh-HK",
) {
  return locale === "en-GB" ? draftAllItemsEn(hk, intl) : draftAllItemsZh(hk, intl);
}

export function weaveMacroIntro(
  themes: DigestTheme[],
  hkItems: DigestItem[],
  intlItems: DigestItem[],
  locale: DigestLocale = "zh-HK",
) {
  void intlItems;
  return locale === "en-GB"
    ? weaveMacroIntroEn(themes, hkItems)
    : weaveMacroIntroZh(themes, hkItems);
}

export function weaveThinkingQuestions(
  themes: DigestTheme[],
  locale: DigestLocale = "zh-HK",
) {
  return locale === "en-GB"
    ? weaveThinkingQuestionsEn(themes)
    : weaveThinkingQuestionsZh(themes);
}

export function weaveClosedLoop(
  themes: DigestTheme[],
  hkItems: DigestItem[],
  intlItems: DigestItem[],
  locale: DigestLocale = "zh-HK",
) {
  return locale === "en-GB"
    ? weaveClosedLoopEn(themes, hkItems, intlItems)
    : weaveClosedLoopZh(themes, hkItems, intlItems);
}
