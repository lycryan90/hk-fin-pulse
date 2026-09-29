import type { DigestItem, ScoredArticle, ThemeId } from "@/lib/digest/schema";
import { THEME_LABELS_I18N } from "@/lib/locale/labels";
import type { DigestTheme } from "@/lib/pipeline/themes";

const LABELS = THEME_LABELS_I18N["en-GB"];

function hasCjk(text: string): boolean {
  return /[\u4e00-\u9fff]/.test(text);
}

function wordCount(text: string): number {
  return text
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

function clampWords(text: string, min: number, max: number): string {
  const words = text.replace(/\s+/g, " ").trim().split(" ").filter(Boolean);
  if (words.length > max) {
    let cut = words.slice(0, max).join(" ");
    if (!/[.!?]$/.test(cut)) cut += ".";
    return cut;
  }
  let out = words.join(" ");
  const pads = [
    "Markets will watch the next data release closely.",
    "Household borrowing costs remain the practical focus.",
  ];
  let i = 0;
  while (wordCount(out) < min && i < 4) {
    out = `${out.replace(/[.!?]$/, "")}. ${pads[i % pads.length]}`;
    i++;
  }
  return out;
}

function themeLabels(ids: ThemeId[]): string {
  return ids
    .slice(0, 2)
    .map((id) => LABELS[id])
    .join(" and ");
}

export function localiseTitleEn(title: string, themeIds: ThemeId[]): string {
  const cleaned = title.replace(/^[〔\[]|[〕\]]$/g, "").trim();
  if (!hasCjk(cleaned) && cleaned.length > 8) {
    // Prefer concise British headline style; strip US wire noise
    return cleaned
      .replace(/\s*-\s*[A-Za-z .'’]+$/u, "")
      .replace(/\s+/g, " ")
      .trim();
  }
  const theme = themeLabels(themeIds) || "macro markets";
  return `Hong Kong / regional update on ${theme}`;
}

function leadEn(article: ScoredArticle): string {
  const summary = article.summary.replace(/\s+/g, " ").trim();
  if (summary && !hasCjk(summary) && wordCount(summary) >= 8) {
    return summary.split(/(?<=[.!?])\s+/)[0] ?? summary;
  }
  if (!hasCjk(article.title)) {
    return localiseTitleEn(article.title, article.themeIds);
  }
  return `Developments tied to ${themeLabels(article.themeIds) || "macro policy"} are reshaping pricing assumptions.`;
}

function macroByThemes(article: ScoredArticle, region: "hk" | "intl", variant: number): string {
  const themes = themeLabels(article.themeIds);
  const openers = [
    "For Hong Kong",
    "From a household perspective",
    "Through the funding channel",
    "In transmission terms",
    "For savers and borrowers",
  ];
  const opener = openers[variant % openers.length];

  if (article.themeIds.includes("regulation")) {
    return `${opener}, ${themes} underline that consumer protection and anti-money-laundering gaps cannot be left unattended; disputes are hard to unwind and trust in financial services may weaken.`;
  }
  if (article.themeIds.includes("oil_geopolitics")) {
    return `${opener}, higher oil prices and geopolitical risk can lift import costs and inflation expectations, adding short-term equity volatility even if energy names benefit selectively.`;
  }
  if (article.themeIds.includes("fed_rates") || article.themeIds.includes("hk_liquidity")) {
    return `${opener}, the linked exchange rate means US rate expectations feed into HIBOR, mortgages and corporate funding; focus on borrowing costs and volatility rather than a single session's move.`;
  }
  if (article.themeIds.includes("asia_fx")) {
    return `${opener}, swings in Asian currencies alter travel, import bills and cross-currency portfolio returns; with the Hong Kong dollar pegged to the US dollar, yen moves still matter for local spending.`;
  }
  if (article.themeIds.includes("cny_crossborder")) {
    return `${opener}, wider renminbi settlement and infrastructure finance may support Hong Kong's offshore renminbi franchise, while shipping and geopolitical risk can tighten trade-finance appetite.`;
  }
  if (article.themeIds.includes("digital_policy")) {
    return `${opener}, tighter overseas rules on algorithms and platform duty of care may raise compliance costs locally and sharpen the balance between youth protection and an open internet.`;
  }
  if (region === "intl") {
    return `${opener}, shifts in ${themes} can reach Hong Kong via dollar liquidity, risk appetite and import prices; growth equities and higher-yielding defensives may react differently.`;
  }
  return `${opener}, this episode touches ${themes} pricing, so local equities, mortgage costs and spending mood may follow rate and risk-preference channels over a medium horizon.`;
}

export function draftItemEn(
  article: ScoredArticle,
  index: number,
  region: "hk" | "intl",
): DigestItem {
  const id = region === "hk" ? `HK ${index + 1}` : `INT ${index + 1}`;
  const title = localiseTitleEn(article.title, article.themeIds);
  const theme = themeLabels(article.themeIds) || "macro drivers";
  let summary = `${leadEn(article)} The episode highlights how ${theme} are rewriting market pricing and policy expectations.`;
  summary = clampWords(summary, 55, 75);

  let macro = macroByThemes(article, region, index);
  macro = clampWords(macro, 55, 75);

  return {
    id,
    region,
    category: article.category,
    source: article.source,
    sourceUrl: article.link,
    title,
    summary,
    macroAnalysis: macro,
    civilianLine: "Watch mortgage rates, inflation and portfolio swings.",
    themeIds: article.themeIds,
  };
}

export function draftAllItemsEn(hk: ScoredArticle[], intl: ScoredArticle[]) {
  return {
    hkItems: hk.slice(0, 10).map((a, i) => draftItemEn(a, i, "hk")),
    intlItems: intl.slice(0, 10).map((a, i) => draftItemEn(a, i, "intl")),
  };
}

function themeSentence(themes: DigestTheme[]): string {
  return themes
    .slice(0, 3)
    .map((t) => t.label)
    .join(", ");
}

export function weaveMacroIntroEn(themes: DigestTheme[], hkItems: DigestItem[]): string {
  const focus = themeSentence(themes);
  const hkTopic =
    themeLabels((hkItems[0]?.themeIds as ThemeId[] | undefined) ?? []) ||
    "local funding and regulation";
  const intlTopic = themeSentence(themes.slice(0, 2)) || "global rates and geopolitics";
  const text = `Federal Reserve policy, commodity prices and geopolitics are intertwined, with today's spine centred on ${focus}. Internationally, ${intlTopic} are re-pricing inflation and safe-haven demand; Hong Kong is pulled by ${hkTopic}, so sector performance is uneven. Under the linked exchange rate, the US rate path feeds directly into local funding costs and asset pricing—households should watch borrowing costs and volatility more than a single day's index move. Offshore renminbi, regulatory catch-up and cross-border finance opportunities are appearing at the same time and belong in any risk-appetite reset.`;
  return clampWords(text, 110, 160);
}

export function weaveThinkingQuestionsEn(themes: DigestTheme[]): string[] {
  const ids = new Set(themes.map((t) => t.id));
  const qs: string[] = [];
  if (ids.has("fed_rates")) {
    qs.push(
      "If the Federal Reserve holds rates steady, what support might Hong Kong equities—especially technology—still receive?",
    );
  }
  if (ids.has("oil_geopolitics")) {
    qs.push(
      "How could persistently higher oil prices affect Hong Kong's import costs, inflation expectations and energy-related shares?",
    );
  }
  if (ids.has("regulation")) {
    qs.push(
      "Where grey crypto channels lack oversight, which concrete steps should Hong Kong authorities take to protect the public?",
    );
  }
  if (ids.has("cny_crossborder") && qs.length < 3) {
    qs.push(
      "As cross-border infrastructure and renminbi settlement expand, how should Hong Kong's offshore renminbi franchise balance return and geopolitical risk?",
    );
  }
  if (ids.has("digital_policy") && qs.length < 3) {
    qs.push(
      "If overseas regimes tighten algorithm accountability, how should Hong Kong strike a balance between safety and openness online?",
    );
  }
  if (ids.has("asia_fx") && qs.length < 3) {
    qs.push(
      "When Asian currencies swing sharply, how should Hong Kong households adjust travel, import spending and asset allocation?",
    );
  }
  if (ids.has("domestic_demand") && qs.length < 3) {
    qs.push(
      "How might shifts in mainland demand and mortgage policy transmit into Hong Kong consumption, property sentiment and related shares?",
    );
  }
  const fallback = [
    "If global capital re-prices risk, how would Hong Kong dollar liquidity and household borrowing costs transmit?",
    "As geopolitics heats up, which operational risks should Hong Kong prioritise as a finance and insurance hub?",
    "With inflation and growth expectations in tension, how should the logic of defensive versus growth assets be adjusted?",
  ];
  for (const q of fallback) {
    if (qs.length >= 3) break;
    if (!qs.includes(q)) qs.push(q);
  }
  return qs.slice(0, 3);
}

export function weaveClosedLoopEn(
  themes: DigestTheme[],
  hkItems: DigestItem[],
  intlItems: DigestItem[],
): string {
  const focus = themeSentence(themes);
  const hasReg = [...hkItems, ...intlItems].some((i) =>
    i.themeIds?.includes("regulation"),
  );
  const text = `External shocks from ${focus} first rewrite the relative appeal of Treasury yields, oil and haven currencies, then feed into global risk appetite. On market pricing, the rate path and commodity inflation expectations set growth-equity discount rates and defensive yield spreads; under Hong Kong's linked exchange rate, HIBOR, mortgages and corporate funding track dollar liquidity, so sector leadership fragments. On households and institutions, ${hasReg ? "regulatory gaps and AML needs underline that consumer protection must catch up, while " : ""}import costs and the felt price level shape family budgets. Looking ahead, watch the Federal Reserve path, geopolitical supply risk and local regulatory signals—and adjust allocation and risk appetite in a closed loop.`;
  return clampWords(text, 110, 160);
}
