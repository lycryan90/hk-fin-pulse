import { clampZh, countZhChars } from "@/lib/digest/chars";
import type { DigestItem, ScoredArticle, ThemeId } from "@/lib/digest/schema";
import type { DigestTheme } from "@/lib/pipeline/themes";
import { THEME_LABELS, TRANSMISSION_WORDS } from "@/lib/policy/editorial";

function hasCjk(text: string): boolean {
  return /[\u4e00-\u9fff]/.test(text);
}

function compactLead(title: string, summary: string, maxChars = 52): string {
  const base = hasCjk(summary) && countZhChars(summary) >= 20 ? summary : title;
  const cleaned = base
    .replace(/\s+/g, " ")
    .replace(/^[〔\[]|[〕\]]$/g, "")
    .trim();
  const zh =
    cleaned.match(/[\u4e00-\u9fff，、；：。「」『』（）0-9A-Za-z%\-\s]{12,}/)?.[0] ??
    cleaned;
  const cut = (zh.split(/[。！？]/)[0] ?? zh).trim();
  const chars = [...cut];
  if (chars.length <= maxChars) return cut;
  return chars.slice(0, maxChars).join("").replace(/[，、；：\s]+$/u, "");
}

function ensureSentence(text: string): string {
  const t = text.trim();
  if (!t) return "相關發展正牽動市場定價。";
  if (/[。！？]$/.test(t)) return t;
  return `${t}。`;
}

function padToRange(text: string, min: number, max: number, pads: string[]): string {
  let out = ensureSentence(text);
  let i = 0;
  while (countZhChars(out) < min && i < pads.length * 3) {
    out = ensureSentence(`${out.replace(/。$/,"")}，${pads[i % pads.length].replace(/。$/,"")}`);
    i++;
  }
  return clampZh(out, Math.min(min, countZhChars(out)), max);
}

function ensureTransmission(text: string): string {
  if (TRANSMISSION_WORDS.some((w) => text.includes(w))) return text;
  return ensureSentence(`${text.replace(/。$/,"")}，並牽動香港資金成本與通脹感受`);
}

function titleBracket(title: string): string {
  return title.replace(/^[〔\[]|[〕\]]$/g, "").trim();
}

function themeLabels(ids: ThemeId[]): string {
  return ids
    .slice(0, 2)
    .map((id) => THEME_LABELS[id])
    .join("與");
}

function macroByThemes(article: ScoredArticle, region: "hk" | "intl", variant: number): string {
  const themes = themeLabels(article.themeIds);
  const openers = ["對香港而言", "以普通人視角", "從資金面觀察", "就風險傳導來看", "換作家庭資產配置"];
  const opener = openers[variant % openers.length];

  if (article.themeIds.includes("regulation")) {
    return `${opener}，${themes}相關事件提醒監管與消費者保護不能留白；一旦出現詐騙或洗錢，追索困難，亦會削弱對金融服務的信任，進而影響本地風險偏好與合規成本。`;
  }
  if (article.themeIds.includes("oil_geopolitics")) {
    return `${opener}，油價與地緣風險上升會推高進口能源成本與通脹預期，港股短線波動加大；同時能源鏈相關股份或受惠，但整體資金流向仍受美國利率路徑主導。`;
  }
  if (article.themeIds.includes("fed_rates") || article.themeIds.includes("hk_liquidity")) {
    return `${opener}，聯繫匯率下美國息口預期會直接反映在拆息、按揭與企業融資成本；高估值成長股對利率敏感，普通人更應關注借貸成本與波動而非單日升跌。`;
  }
  if (article.themeIds.includes("asia_fx")) {
    return `${opener}，亞洲匯市波動會改變旅遊、進口消費與跨幣資產的匯兌結果；港元跟美元掛鈎，日圓等貨幣急升貶會間接影響香港對外商務與投資配置。`;
  }
  if (article.themeIds.includes("cny_crossborder")) {
    return `${opener}，跨境人民幣結算與基建融資若擴張，有利離岸人民幣與綠色債券業務，但地緣與航運風險也會牽動貿易融資額度與保險成本。`;
  }
  if (article.themeIds.includes("digital_policy")) {
    return `${opener}，海外若收緊演算法與數位照護責任，本地平台合規成本可能上升，亦提醒香港在保護年輕用戶與網絡規管之間需找到可執行平衡。`;
  }
  if (region === "intl") {
    return `${opener}，外圍${themes}變動可經美元流動性、避險情緒與進口價格渠道影響香港；資金重新定價時，成長股與高息防禦資產反應將分化。`;
  }
  return `${opener}，此事牽動${themes}定價邏輯，本地股市、樓市融資與消費意願都可能受利率與風險偏好牽引，宜以中期傳導而非單日行情解讀。`;
}

export function draftItem(
  article: ScoredArticle,
  index: number,
  region: "hk" | "intl",
): DigestItem {
  const id = region === "hk" ? `港 ${index + 1}` : `國 ${index + 1}`;
  const lead = compactLead(article.title, article.summary);
  const themeHint = themeLabels(article.themeIds) || "宏觀";

  let summary = hasCjk(lead)
    ? `${ensureSentence(lead).replace(/。$/,"")}，反映${themeHint}因素正改寫市場定價與政策預期。`
    : `外圍報導指出相關發展升溫，焦點落在${themeHint}；雖原文偏英語標題，其對利率、商品與風險偏好的含義仍值得香港讀者跟進。`;

  summary = padToRange(summary, 80, 100, [
    "後續數據與官方表態將左右短線資金去向",
    "投資人情緒因而在避險與趁低吸納之間搖擺",
  ]);

  let macro = ensureTransmission(macroByThemes(article, region, index));
  macro = padToRange(macro, 80, 100, [
    "高息環境下現金流穩定資產相對受注目",
    "波動上升時更宜檢視槓桿與還款能力",
  ]);

  const civilianLine = clampZh(
    region === "hk"
      ? "留意按揭息口、通脹感受與投資組合波動。"
      : "關注油價、匯率與海外政策如何影響本地物價。",
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
  const hkTopic =
    themeLabels((hkItems[0]?.themeIds as ThemeId[] | undefined) ?? []) ||
    "本地金融與監管動態";
  const intlTopic = themeSentence(themes.slice(0, 2)) || "外圍利率與地緣風險";
  const text = `美聯儲政策、商品價格與地緣政治交織，當日主線落在${focus}。國際層面圍繞${intlTopic}重新定價通脹與避險情緒；香港則受${hkTopic}等發展牽動，板塊表現分化。港元掛鈎下，美國利率路徑直接牽動本地資金成本與資產定價，普通人宜聚焦借貸成本與波動。離岸人民幣、監管補位與跨境融資機會亦同時出現，需要一併納入風險偏好調整。`;
  return clampZh(text, 150, 250);
}

export function weaveThinkingQuestions(themes: DigestTheme[]): string[] {
  const ids = new Set(themes.map((t) => t.id));
  const qs: string[] = [];

  if (ids.has("fed_rates")) {
    qs.push("美聯儲若維持利率不變，香港股市尤其是科技板塊會得到什麼類型的支撐？");
  }
  if (ids.has("oil_geopolitics")) {
    qs.push("油價持續上升對香港進口成本、通脹預期及能源相關股票有何潛在影響？");
  }
  if (ids.has("regulation")) {
    qs.push("灰色加密資產渠道缺乏監管時，香港當局應採取哪些具體措施保護市民？");
  }
  if (ids.has("cny_crossborder") && qs.length < 3) {
    qs.push("跨境基建與人民幣結算擴大時，香港離岸人民幣業務如何平衡收益與地緣風險？");
  }
  if (ids.has("digital_policy") && qs.length < 3) {
    qs.push("海外強化演算法問責後，香港網絡規管應如何在安全與開放之間取捨？");
  }
  if (ids.has("asia_fx") && qs.length < 3) {
    qs.push("亞洲貨幣大幅波動時，香港家庭的旅遊、進口消費與資產配置應如何因應？");
  }
  if (ids.has("domestic_demand") && qs.length < 3) {
    qs.push("內地需求與房貸政策變化，會怎樣傳導到香港消費、樓市情緒與相關股份？");
  }

  const fallback = [
    "若全球資金重新定價風險，港元流動性與普通人借貸成本會出現怎樣的傳導？",
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
  const hasReg = [...hkItems, ...intlItems].some((i) =>
    i.themeIds?.includes("regulation"),
  );
  const text = `外部衝擊來自${focus}等主線，先改寫美債收益率、油價與避險貨幣的相對吸引力，再傳導至全球風險偏好。市場定價上，利率路徑與商品通脹預期決定成長股折現與防禦資產息差；香港在聯繫匯率下，拆息、按揭與企業融資成本跟蹤美元流動性，港股因而出現板塊分化。民生與制度層面，${hasReg ? "監管空白與反洗錢需求提醒消費者保護必須補位，" : ""}進口成本與物價感受亦影響家庭預算。展望上，宜緊盯美聯儲利率路徑、地緣供應風險與本地監管動向，以閉環方式調整配置與風險偏好。`;
  return clampZh(text, 150, 250);
}
