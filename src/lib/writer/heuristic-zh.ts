import { clampZh, countZhChars } from "@/lib/digest/chars";
import type { DigestItem, ScoredArticle, ThemeId } from "@/lib/digest/schema";
import { THEME_LABELS_I18N } from "@/lib/locale/labels";
import type { DigestTheme } from "@/lib/pipeline/themes";
import { TRANSMISSION_WORDS } from "@/lib/policy/editorial";

const LABELS = THEME_LABELS_I18N["zh-HK"];

function hasCjk(text: string): boolean {
  return /[\u4e00-\u9fff]/.test(text);
}

function themeLabels(ids: ThemeId[]): string {
  return ids
    .slice(0, 2)
    .map((id) => LABELS[id])
    .join("同");
}

/** Localise display title into Hong Kong Chinese; never leave raw English as the spoken headline. */
export function localiseTitleZh(title: string, themeIds: ThemeId[]): string {
  const cleaned = title.replace(/^[〔\[]|[〕\]]$/g, "").trim();
  if (hasCjk(cleaned)) return cleaned;
  const theme = themeLabels(themeIds) || "宏觀市場";
  return `外圍要聞：${theme}相關發展`;
}

function compactLead(title: string, summary: string, themeIds: ThemeId[], maxChars = 52): string {
  if (hasCjk(summary) && countZhChars(summary) >= 20) {
    const cut = (summary.split(/[。！？]/)[0] ?? summary).trim();
    const chars = [...cut];
    if (chars.length <= maxChars) return cut;
    return chars.slice(0, maxChars).join("").replace(/[，、；：\s]+$/u, "");
  }
  if (hasCjk(title)) {
    return localiseTitleZh(title, themeIds);
  }
  return `外圍報道聚焦${themeLabels(themeIds) || "息口同商品"}走勢`;
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
    out = ensureSentence(
      `${out.replace(/。$/, "")}，${pads[i % pads.length].replace(/。$/, "")}`,
    );
    i++;
  }
  return clampZh(out, Math.min(min, countZhChars(out)), max);
}

function ensureTransmission(text: string): string {
  if (TRANSMISSION_WORDS.some((w) => text.includes(w))) return text;
  return ensureSentence(`${text.replace(/。$/, "")}，並牽動香港資金成本同通脹感受`);
}

function macroByThemes(article: ScoredArticle, region: "hk" | "intl", variant: number): string {
  const themes = themeLabels(article.themeIds);
  const openers = ["對香港嚟講", "以普通人角度", "由資金面睇", "就風險傳導嚟睇", "換作家長同打工仔"];
  const opener = openers[variant % openers.length];

  if (article.themeIds.includes("regulation")) {
    return `${opener}，${themes}相關事態提醒監管同消費者保障唔可以留白；一旦出現詐騙或洗黑錢，追討好難，亦會削弱市民對金融服務嘅信心。`;
  }
  if (article.themeIds.includes("oil_geopolitics")) {
    return `${opener}，油價同地緣風險上升會推高進口能源成本同通脹預期，港股短線波動加大；能源鏈股份或受惠，但資金流向仍主要跟美國息口路徑。`;
  }
  if (article.themeIds.includes("fed_rates") || article.themeIds.includes("hk_liquidity")) {
    return `${opener}，聯繫匯率底下美國息口預期會直接反映喺拆息、按揭同企業融資成本；普通人更應睇借貸成本同波動，而唔係單日升跌。`;
  }
  if (article.themeIds.includes("asia_fx")) {
    return `${opener}，亞洲匯市波動會改變外遊、進口消費同跨幣資產嘅匯兌結果；港元掛鈎美元，日圓急升急跌都會間接影響本地消費同配置。`;
  }
  if (article.themeIds.includes("cny_crossborder")) {
    return `${opener}，跨境人民幣結算同基建融資若再擴張，有利離岸人民幣同綠色債券業務，但地緣同航運風險亦會牽動貿易融資同保險成本。`;
  }
  if (article.themeIds.includes("digital_policy")) {
    return `${opener}，海外若收緊演算法同數碼平台責任，本地平台合規成本可能上升，亦提醒香港喺保護年輕用戶同網絡規管之間要搵到可行平衡。`;
  }
  if (region === "intl") {
    return `${opener}，外圍${themes}變動可經美元流動性、避險情緒同進口價格影響香港；資金重新定價時，增長股同高息防守資產反應會分化。`;
  }
  return `${opener}，呢件事牽動${themes}定價邏輯，本地股市、樓按同消費意欲都可能受息口同風險偏好牽引，宜用中期傳導角度解讀。`;
}

export function draftItemZh(
  article: ScoredArticle,
  index: number,
  region: "hk" | "intl",
): DigestItem {
  const id = region === "hk" ? `港 ${index + 1}` : `國 ${index + 1}`;
  const title = localiseTitleZh(article.title, article.themeIds);
  const lead = compactLead(article.title, article.summary, article.themeIds);
  const themeHint = themeLabels(article.themeIds) || "宏觀";

  let summary = `${ensureSentence(lead).replace(/。$/, "")}，反映${themeHint}因素正改寫市場定價同政策預期。`;
  summary = padToRange(summary, 80, 100, [
    "後續數據同官方表態會左右短線資金去向",
    "投資人情緒因而喺避險同趁低吸納之間搖擺",
  ]);

  let macro = ensureTransmission(macroByThemes(article, region, index));
  macro = padToRange(macro, 80, 100, [
    "高息環境下現金流較穩嘅資產相對受注目",
    "波動上升時更宜檢視槓桿同還款能力",
  ]);

  return {
    id,
    region,
    category: article.category,
    source: article.source,
    sourceUrl: article.link,
    title,
    summary,
    macroAnalysis: macro,
    civilianLine: "留意按揭息口、通脹感受同投資組合波動。",
    themeIds: article.themeIds,
  };
}

export function draftAllItemsZh(hk: ScoredArticle[], intl: ScoredArticle[]) {
  return {
    hkItems: hk.slice(0, 10).map((a, i) => draftItemZh(a, i, "hk")),
    intlItems: intl.slice(0, 10).map((a, i) => draftItemZh(a, i, "intl")),
  };
}

function themeSentence(themes: DigestTheme[]): string {
  return themes
    .slice(0, 3)
    .map((t) => t.label)
    .join("、");
}

export function weaveMacroIntroZh(
  themes: DigestTheme[],
  hkItems: DigestItem[],
): string {
  const focus = themeSentence(themes);
  const hkTopic =
    themeLabels((hkItems[0]?.themeIds as ThemeId[] | undefined) ?? []) ||
    "本地金融同監管動態";
  const intlTopic = themeSentence(themes.slice(0, 2)) || "外圍息口同地緣風險";
  const text = `美聯儲政策、商品價格同地緣政治交織，當日主線落喺${focus}。國際層面圍繞${intlTopic}重新定價通脹同避險情緒；香港則受${hkTopic}等發展牽動，板塊表現分化。港元掛鈎底下，美國息口路徑直接牽動本地資金成本同資產定價，普通人宜聚焦借貸成本同波動。離岸人民幣、監管補位同跨境融資機會亦同時出現，需要一併納入風險偏好調整。`;
  return clampZh(text, 150, 250);
}

export function weaveThinkingQuestionsZh(themes: DigestTheme[]): string[] {
  const ids = new Set(themes.map((t) => t.id));
  const qs: string[] = [];
  if (ids.has("fed_rates")) {
    qs.push("美聯儲若維持息口不變，香港股市尤其科技板塊會得到咩類型嘅支撐？");
  }
  if (ids.has("oil_geopolitics")) {
    qs.push("油價持續上升對香港進口成本、通脹預期同能源相關股份有咩潛在影響？");
  }
  if (ids.has("regulation")) {
    qs.push("灰色加密資產渠道缺乏監管時，香港當局應採取邊啲具體措施保護市民？");
  }
  if (ids.has("cny_crossborder") && qs.length < 3) {
    qs.push("跨境基建同人民幣結算擴大時，香港離岸人民幣業務點樣平衡收益同地緣風險？");
  }
  if (ids.has("digital_policy") && qs.length < 3) {
    qs.push("海外強化演算法問責之後，香港網絡規管應點樣喺安全同開放之間取捨？");
  }
  if (ids.has("asia_fx") && qs.length < 3) {
    qs.push("亞洲貨幣大幅波動時，香港家庭嘅外遊、進口消費同資產配置應點因應？");
  }
  if (ids.has("domestic_demand") && qs.length < 3) {
    qs.push("內地需求同房貸政策變化，會點傳導到香港消費、樓市情緒同相關股份？");
  }
  const fallback = [
    "若全球資金重新定價風險，港元流動性同普通人借貸成本會出現點樣嘅傳導？",
    "地緣政治升溫時，香港作為國際金融同保險中心應優先管理邊啲實務風險？",
    "喺通脹同增長預期拉扯下，防守性資產同增長股嘅配置邏輯應點調整？",
  ];
  for (const q of fallback) {
    if (qs.length >= 3) break;
    if (!qs.includes(q)) qs.push(q);
  }
  return qs.slice(0, 3);
}

export function weaveClosedLoopZh(
  themes: DigestTheme[],
  hkItems: DigestItem[],
  intlItems: DigestItem[],
): string {
  const focus = themeSentence(themes);
  const hasReg = [...hkItems, ...intlItems].some((i) =>
    i.themeIds?.includes("regulation"),
  );
  const text = `外部衝擊來自${focus}等主線，先改寫美債收益率、油價同避險貨幣嘅相對吸引力，再傳導至全球風險偏好。市場定價上，息口路徑同商品通脹預期決定增長股折現同防守資產息差；香港喺聯繫匯率底下，拆息、按揭同企業融資成本跟蹤美元流動性，港股因而出現板塊分化。民生同制度層面，${hasReg ? "監管空白同反洗黑錢需求提醒消費者保障必須補位，" : ""}進口成本同物價感受亦影響家庭預算。展望上，宜緊盯美聯儲息口路徑、地緣供應風險同本地監管動向，以閉環方式調整配置同風險偏好。`;
  return clampZh(text, 150, 250);
}
