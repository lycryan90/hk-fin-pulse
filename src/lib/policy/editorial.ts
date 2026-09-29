import type { NewsCategory, ThemeId } from "@/lib/digest/schema";

/** @deprecated Prefer THEME_LABELS_I18N from locale/labels */
export const THEME_LABELS: Record<ThemeId, string> = {
  fed_rates: "美聯儲利率",
  oil_geopolitics: "油價／中東",
  hk_liquidity: "港元流動性",
  regulation: "監管／加密",
  cny_crossborder: "人民幣跨境",
  asia_fx: "亞洲匯市",
  domestic_demand: "內需復蘇",
  digital_policy: "數位政策",
  other: "其他宏觀",
};

export const TRANSMISSION_WORDS = [
  "利率",
  "通脹",
  "資金",
  "匯率",
  "監管",
  "借貸",
  "消費",
  "風險",
  "就業",
  "樓市",
  "定價",
  "流動性",
  "避險",
  "港元",
  "民生",
] as const;

const BOOST_KEYWORDS: { re: RegExp; weight: number; themes: ThemeId[] }[] = [
  { re: /聯儲|美聯儲|加息|減息|利率|非農|就業報告|鷹派|鴿派|息口|Federal Reserve|Fed\b|interest rate|rate cut|rate hike|payroll/i, weight: 8, themes: ["fed_rates"] },
  { re: /油價|原油|布倫特|伊朗|霍爾木茲|中東|地緣|oil price|Brent|crude|Iran|Middle East|geopolit/i, weight: 8, themes: ["oil_geopolitics"] },
  { re: /國債|債息|殖利率|債券|回購|流動性|拆息|HIBOR|港元|掛鈎|Treasury|bond yield|liquidity/i, weight: 7, themes: ["hk_liquidity", "fed_rates"] },
  { re: /加密|比特幣|虛擬資產|洗錢|詐騙|自助機|證監|監管|crypto|bitcoin|money laundering|regulator/i, weight: 7, themes: ["regulation"] },
  { re: /人民幣|離岸|結算|一帶一路|跨境|綠色債券|renminbi|yuan|Belt and Road/i, weight: 6, themes: ["cny_crossborder"] },
  { re: /日圓|日元|匯率|央行加息|避險貨幣|yen|Bank of Japan|currency/i, weight: 6, themes: ["asia_fx"] },
  { re: /內地|滬深|內需|地產|生物科技|消費|出口|China|property|mainland/i, weight: 5, themes: ["domestic_demand"] },
  { re: /算法|社群媒體|數位|內容審查|未成年人|社交|algorithm|social media|digital duty of care/i, weight: 5, themes: ["digital_policy"] },
  { re: /港股|恒生|科技股|阿里|股市|華爾街|標普|納斯達克|Hang Seng|Hong Kong|Wall Street|S&P|Nasdaq/i, weight: 5, themes: ["hk_liquidity", "fed_rates"] },
  { re: /台灣|戰狼|太平洋|移民|澳洲|外交|Taiwan|Australia|immigration|diplomacy/i, weight: 4, themes: ["other"] },
];

const EXCLUDE =
  /娛樂圈|演唱會|足球賽果|籃球|明星緋聞|彩票|天氣報告|食譜|影視綜|celebrity gossip|recipe|football score/i;

const HK_HINT =
  /香港|港股|恒生|港元|證監會|金管局|鰂魚涌|九龍|新界|離岸人民幣|港交所|RTHK|SCMP/i;

export function isExcluded(title: string, summary: string): boolean {
  return EXCLUDE.test(`${title} ${summary}`);
}

export function inferThemes(text: string): ThemeId[] {
  const hits = new Set<ThemeId>();
  for (const rule of BOOST_KEYWORDS) {
    if (rule.re.test(text)) rule.themes.forEach((t) => hits.add(t));
  }
  if (hits.size === 0) hits.add("other");
  return [...hits];
}

export function inferCategory(text: string, themes: ThemeId[]): NewsCategory {
  if (themes.includes("oil_geopolitics") && /伊朗|中東|導彈|空襲|戰狼|外交/.test(text)) {
    return "geopolitics";
  }
  if (themes.includes("digital_policy") || themes.includes("regulation")) {
    if (/立法|部長|議會|政府|反對黨|移民/.test(text)) return "government";
    if (themes.includes("regulation")) return "finance";
  }
  if (themes.includes("fed_rates") || themes.includes("hk_liquidity") || themes.includes("asia_fx") || themes.includes("cny_crossborder")) {
    return "finance";
  }
  if (/移民|教育|民生|社會/.test(text)) return "society";
  if (/政府|立法|部長|議會/.test(text)) return "government";
  return "finance";
}

export function inferRegion(
  title: string,
  summary: string,
  hint: "hk" | "intl" | "unknown",
): "hk" | "intl" {
  const text = `${title} ${summary}`;
  if (hint === "hk" || HK_HINT.test(text)) return "hk";
  if (hint === "intl") return "intl";
  return HK_HINT.test(text) ? "hk" : "intl";
}

export function scoreArticle(title: string, summary: string): number {
  const text = `${title} ${summary}`;
  if (isExcluded(title, summary)) return -100;
  let score = 1;
  for (const rule of BOOST_KEYWORDS) {
    if (rule.re.test(text)) score += rule.weight;
  }
  if (/香港|港股|港元/.test(text)) score += 3;
  if (/普通人|民生|借貸|通脹|消費者/.test(text)) score += 2;
  return score;
}

/** Max items sharing the same primary theme within one region. */
export const MAX_PER_THEME = 2;
