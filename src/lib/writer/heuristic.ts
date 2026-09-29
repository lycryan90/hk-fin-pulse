import { clampZh, countZhChars } from "@/lib/digest/chars";
import type { DigestItem, ScoredArticle, ThemeId } from "@/lib/digest/schema";
import type { DigestTheme } from "@/lib/pipeline/themes";
import { TRANSMISSION_WORDS } from "@/lib/policy/editorial";

function padToRange(text: string, min: number, max: number, pad: string): string {
  let out = text.trim();
  if (countZhChars(out) < min) {
    out = `${out}${pad}`;
  }
  return clampZh(out, Math.min(min, countZhChars(out)), max);
}

function ensureTransmission(text: string): string {
  if (TRANSMISSION_WORDS.some((w) => text.includes(w))) return text;
  return `${text}這將牽動香港資金成本、通脹感受與風險偏好。`;
}

function titleBracket(title: string): string {
  const t = title.replace(/^[〔\[]|[〕\]]$/g, "").trim();
  return t;
}

export function draftItem(
  article: ScoredArticle,
  index: number,
  region: "hk" | "intl",
): DigestItem {
  const id = region === "hk" ? `港 ${index + 1}` : `國 ${index + 1}`;
  const base = article.summary || article.title;
  const fact = clampZh(
    `${article.title}。${base}`.replace(/。。/g, "。"),
    40,
    90,
  );

  let summary = `${fact}事件凸顯${article.themeIds.map((t) => t).join("、")}相關變數正改寫市場定價節奏。`;
  summary = padToRange(
    summary,
    80,
    100,
    "各方正觀望後續數據與政策訊號，以調整短線風險暴露。",
  );

  const hkLens =
    region === "hk"
      ? "對香港而言，聯繫匯率下本地融資成本與資產定價會率先反映外圍利率與油價預期。"
      : "外圍變動可經美元流動性、避險情緒與進口成本渠道，間接影響香港市民的借貸與消費。";

  let macro = ensureTransmission(
    `${hkLens}${article.title.includes("監管") || article.themeIds.includes("regulation") ? "監管空白或合規成本亦會影響普通人對金融服務的信任。" : "投資者宜把焦點放在利率路徑與波動，而非單日指數升跌。"}`,
  );
  macro = padToRange(
    macro,
    80,
    100,
    "資金重新定價風險時，高估值成長股與高息防禦資產反應將分化。",
  );

  const civilianLine = clampZh(
    region === "hk"
      ? "普通人應留意按揭與信用卡息口、通脹感受及市場波動。"
      : "關注油價、匯率與海外政策如何影響本地物價與就業預期。",
    16,
    40,
  );

  return {
    id,
    region,
    category: article.category,
    source: article.source,
    sourceUrl: article.link,
    title: titleBracket(article.title),
    summary,
    macroAnalysis: macro,
    civilianLine,
    themeIds: article.themeIds,
  };
}

export function draftAllItems(
  hk: ScoredArticle[],
  intl: ScoredArticle[],
): { hkItems: DigestItem[]; intlItems: DigestItem[] } {
  return {
    hkItems: hk.slice(0, 10).map((a, i) => draftItem(a, i, "hk")),
    intlItems: intl.slice(0, 10).map((a, i) => draftItem(a, i, "intl")),
  };
}

function themeSentence(themes: DigestTheme[]): string {
  return themes
    .slice(0, 3)
    .map((t) => t.label)
    .join("、");
}

export function weaveMacroIntro(
  themes: DigestTheme[],
  hkItems: DigestItem[],
  intlItems: DigestItem[],
): string {
  const focus = themeSentence(themes);
  const hkHint = hkItems[0]?.title ?? "港股與監管動態";
  const intlHint = intlItems[0]?.title ?? "外圍利率與地緣風險";
  const text = `美聯儲政策轉向與中東局勢等外圍變數交織，當日主線集中在${focus}。國際方面，${intlHint}等消息牽動油價、債息與避險情緒；香港則面對${hkHint}等發展，科技、地產與受監管板塊表現分化。港元掛鈎機制下，美國利率路徑直接影響本地資金成本與資產定價，普通人更應關注借貸成本與波動，而非單日指數漲跌。離岸人民幣與跨境基建相關機會亦隨地緣與外交行程浮現，需一併納入風險偏好調整。`;
  return clampZh(text, 150, 250);
}

export function weaveThinkingQuestions(themes: DigestTheme[]): string[] {
  const ids = new Set(themes.map((t) => t.id));
  const qs: string[] = [];

  if (ids.has("fed_rates")) {
    qs.push(
      "美聯儲若維持利率不變，香港股市尤其是科技板塊會得到什麼樣的支撐？",
    );
  }
  if (ids.has("oil_geopolitics")) {
    qs.push(
      "油價持續上升對香港的進口成本、通脹預期及能源相關股票表現有哪些潛在影響？",
    );
  }
  if (ids.has("regulation")) {
    qs.push(
      "灰色加密資產渠道缺乏監管的風險下，香港監管當局應該採取哪些具體措施？",
    );
  }
  if (ids.has("cny_crossborder") && qs.length < 3) {
    qs.push(
      "跨境基建與人民幣結算機會擴大時，香港離岸人民幣業務如何平衡收益與地緣風險？",
    );
  }
  if (ids.has("digital_policy") && qs.length < 3) {
    qs.push(
      "海外若強化演算法與數位照護責任，香港網絡規管應如何在安全與言論空間之間取捨？",
    );
  }
  if (ids.has("asia_fx") && qs.length < 3) {
    qs.push(
      "日圓等亞洲貨幣大幅波動時，香港家庭的旅遊、進口消費與資產配置應如何因應？",
    );
  }

  const fallback = [
    "若全球資金重新定價風險，港元流動性與普通人借貸成本會出現怎樣的傳導路徑？",
    "地緣政治升溫時，香港作為國際金融與保險中心應優先管理哪些實務風險？",
    "在通脹與增長預期拉扯下，防禦性資產與成長股的配置邏輯應如何調整？",
  ];
  for (const q of fallback) {
    if (qs.length >= 3) break;
    if (!qs.includes(q)) qs.push(q);
  }
  return qs.slice(0, 3);
}

export function weaveClosedLoop(
  themes: DigestTheme[],
  hkItems: DigestItem[],
  intlItems: DigestItem[],
): string {
  const focus = themeSentence(themes);
  const reg = [...hkItems, ...intlItems].find((i) =>
    i.themeIds?.includes("regulation" as ThemeId),
  );
  const text = `外部衝擊來自${focus}等主線，先改寫美債收益率、油價與避險貨幣的相對吸引力，再傳導至全球風險偏好。市場定價層面，利率路徑與商品通脹預期決定成長股折現與防禦資產息差；香港在聯繫匯率下，拆息、按揭與企業融資成本跟蹤美元流動性，港股板塊因而出現科技反彈、週期承壓等分化。民生與制度層面，${reg ? "加密自助機等監管空白提醒消費者保護與反洗錢需要補位，" : ""}進口能源成本與物價感受亦會影響家庭預算。展望上，投資者宜緊盯美聯儲利率路徑、中東地緣與本地監管動向三條線索，以閉環方式調整資產配置與風險偏好。`;
  return clampZh(text, 150, 250);
}
