import type { DigestLocale } from "@/lib/locale/types";
import { DEFAULT_LOCALE } from "@/lib/locale/types";
import { gatherOutlookContext, resolveWeekOf } from "@/lib/outlook/context";
import {
  WeeklyOutlookSchema,
  type WeeklyOutlook,
} from "@/lib/outlook/schema";
import { writeOutlook } from "@/lib/outlook/store";
import {
  callLlmJson,
  llmConfigured,
  llmEndpoint,
} from "@/lib/writer/llm";

function outlookSystem(locale: DigestLocale): string {
  if (locale === "en-GB") {
    return `You are a Hong Kong-based macro strategist. Write ONLY British English. No investment buy/sell recommendations. Output strict JSON for a weekly trends & outlook note covering: geopolitics, finance & currency, China–Hong Kong political economy, and sector rotation (e.g. oil up / gold soft, IPO waves lifting related industries, rate-sensitive vs commodity vs defensives). Be concrete about cross-asset and sector leadership shifts.`;
  }
  return `你是駐港宏觀策略編輯。全文必須用香港繁體／港式用語，禁止中英夾雜與投資買賣建議。輸出嚴格 JSON 週報「趨勢及展望」，綜合：全球地緣政治、金融與貨幣、中港政治經濟核心，以及板塊輪動（例如油價升／黃金回軟、新股潮帶動相關產業、息口敏感股 vs 商品 vs 防守板塊等）。要寫清楚跨資產同板塊領導力點樣轉。`;
}

function heuristicOutlook(
  weekOf: string,
  locale: DigestLocale,
  ctx: Awaited<ReturnType<typeof gatherOutlookContext>>,
): WeeklyOutlook {
  const themes = [
    ...new Set(ctx.digests.flatMap((d) => d.themes)),
  ].slice(0, 5);
  const themeLine = themes.join(locale === "en-GB" ? "; " : "、") || (
    locale === "en-GB" ? "rates, oil and liquidity" : "息口、油價同流動性"
  );
  const now = new Date().toISOString();

  if (locale === "en-GB") {
    return WeeklyOutlookSchema.parse({
      weekOf,
      createdAt: now,
      locale,
      title: "Weekly trends & outlook",
      executiveSummary: `This week’s spine centres on ${themeLine}. Geopolitics, dollar funding and China–Hong Kong policy signals are jointly rewriting risk appetite. Without an LLM pass this note is a structural scaffold from recent digests—configure an API key for a fuller synthesis.`,
      geopolitics: {
        headline: "Geopolitical risk still prices into commodities and haven flows",
        analysis:
          "Flashpoints in energy corridors keep a risk premium in oil and shipping insurance. Safe-haven demand can support the dollar and selective precious metals, while risk assets stay sensitive to headline swings rather than a single equity session.",
      },
      financeCurrency: {
        headline: "Rates and FX set the cost of capital for Hong Kong",
        analysis:
          "Under the linked exchange rate, US yields and HIBOR guide mortgage and corporate funding. A firmer dollar tightens local liquidity; any shift in Fed path quickly reorders growth versus defensive leadership.",
      },
      chinaHongKong: {
        headline: "Mainland demand policy meets Hong Kong’s offshore role",
        analysis:
          "Credit support and property-related measures on the mainland feed Hong Kong equities, USD credit and renminbi business. Regulatory and political signals remain part of the risk premium for cross-border capital.",
      },
      sectorRotation: [
        {
          theme: "Oil firmer / defensives bid",
          observation: "Energy geopolitical premia tend to lift energy and selective insurers while pressuring high-duration growth.",
          implication: "Watch whether gold acts as haven or yields crowd it out when real rates stay high.",
          relatedSectors: ["Energy", "Insurance", "Growth tech"],
        },
        {
          theme: "IPO / listing pipeline",
          observation: "Heavier listing calendars often spotlight sponsors’ ecosystems: brokers, exchanges, legal and marketing services.",
          implication: "Secondary beneficiaries can include upstream suppliers of the listing cohort’s industry.",
          relatedSectors: ["Brokers", "Exchanges", "Business services"],
        },
        {
          theme: "Rate-sensitive versus cash-flow compounders",
          observation: "Sticky policy rates keep pressure on long-duration names; cash-generative defensives hold relative bid.",
          implication: "Hong Kong property and high-leverage stories stay hostage to HIBOR.",
          relatedSectors: ["Property", "Banks", "Utilities"],
        },
        {
          theme: "Renminbi / AH premium",
          observation: "Cross-border settlement and southbound flows can rotate leadership toward dual-listed and offshore RMB products.",
          implication: "Currency stability narratives matter as much as equity beta.",
          relatedSectors: ["Brokers", "Chinese ADRs/AH", "RMB bonds"],
        },
      ],
      watchlist: [
        "Federal Reserve path and US Treasury yields",
        "Oil and Middle East shipping risk",
        "Hong Kong liquidity / HIBOR",
        "Mainland credit and property policy",
      ],
      closingNote:
        "Treat this as a map of transmissions, not a trade list. Next week’s leadership will still hinge on rates, commodities and China–Hong Kong policy surprises.",
      meta: {
        writerMode: "heuristic",
        sourceDigestDates: ctx.sourceDigestDates,
        headlineCount: ctx.freshHeadlines.length,
        generatedAt: now,
      },
    });
  }

  return WeeklyOutlookSchema.parse({
    weekOf,
    createdAt: now,
    locale,
    title: "趨勢及展望",
    executiveSummary: `本週主線集中在${themeLine}。地緣、美元資金同中港政策訊號一齊改寫風險偏好。未接 LLM 時呢份係由近日 digest 抽出嘅結構骨架——設定 API key 可做更完整綜合。`,
    geopolitics: {
      headline: "地緣風險仍反映喺商品同避險資金",
      analysis:
        "能源通道同區域衝突令油價同航運保險維持風險溢價。避險需求可支撐美元同部分貴金屬，風險資產則對突發消息敏感，多過對單日股市反應。",
    },
    financeCurrency: {
      headline: "息口同匯市決定香港資金成本",
      analysis:
        "聯繫匯率底下，美債息同拆息主導按揭同企業融資。美元偏強會抽緊本地流動性；聯儲路徑一變，增長股同防守股領導力就會重新排位。",
    },
    chinaHongKong: {
      headline: "內地需求政策對接香港離岸角色",
      analysis:
        "內地信貸同樓市相關措施會傳導到港股、美元債同人民幣業務。監管同政治訊號仍然係跨境資金風險溢價嘅一部分。",
    },
    sectorRotation: [
      {
        theme: "油價偏強／防守受捧",
        observation: "能源地緣溢價往往帶動能源同部分保險，同時壓抑長存續期增長股。",
        implication: "要觀察黃金係避險定係被高實質息口擠出。",
        relatedSectors: ["能源", "保險", "科技增長"],
      },
      {
        theme: "新股／上市潮",
        observation: "上市日程密時，券商、交易所、法律同市場服務生態會先受注目。",
        implication: "次受益可延伸到新股所屬產業上游供應鏈。",
        relatedSectors: ["券商", "交易所", "商業服務"],
      },
      {
        theme: "息口敏感 vs 現金流穩陣",
        observation: "政策利率黏性令長存續期股份受壓，現金流防守相對受捧。",
        implication: "香港地產同高槓桿故事仍然綁住拆息。",
        relatedSectors: ["地產", "銀行", "公用"],
      },
      {
        theme: "人民幣／AH 溢價",
        observation: "跨境結算同南向資金可令雙重上市同離岸人民幣產品輪動向上。",
        implication: "匯率穩定敘事同股票 beta 一樣重要。",
        relatedSectors: ["券商", "AH／中資股", "人民幣債"],
      },
    ],
    watchlist: [
      "美聯儲路徑同美債息",
      "油價同中東航運風險",
      "香港流動性／拆息",
      "內地信貸同樓市政策",
    ],
    closingNote:
      "呢份係傳導地圖，唔係買賣清單。下週板塊領導力仍主要睇息口、商品同中港政策意外。",
    meta: {
      writerMode: "heuristic",
      sourceDigestDates: ctx.sourceDigestDates,
      headlineCount: ctx.freshHeadlines.length,
      generatedAt: now,
    },
  });
}

export type GenerateOutlookOptions = {
  locale?: DigestLocale;
  weekOf?: string;
  forceHeuristic?: boolean;
};

export async function generateWeeklyOutlook(
  options: GenerateOutlookOptions = {},
): Promise<WeeklyOutlook> {
  const locale = options.locale ?? DEFAULT_LOCALE;
  const weekOf = options.weekOf ?? resolveWeekOf();
  const ctx = await gatherOutlookContext(weekOf);
  const createdAt = new Date().toISOString();

  if (options.forceHeuristic || !llmConfigured()) {
    const outlook = heuristicOutlook(weekOf, locale, ctx);
    await writeOutlook(outlook);
    return outlook;
  }

  const { model } = llmEndpoint();
  const system = outlookSystem(locale);
  const prompt =
    locale === "en-GB"
      ? `Build a weekly trends & outlook JSON with fields:
weekOf (use ${weekOf}), createdAt (ISO), locale ("en-GB"), title,
executiveSummary (150-220 words),
geopolitics/financeCurrency/chinaHongKong each {headline, analysis 80-140 words},
sectorRotation: 4-6 items {theme, observation, implication, relatedSectors[]},
watchlist: 3-5 strings, closingNote.
Emphasise sector rotation mechanics (oil/gold, IPOs, rates, RMB/AH, etc.).
Context: ${JSON.stringify(ctx)}`
      : `請生成週報「趨勢及展望」JSON，欄位：
weekOf（用 ${weekOf}）、createdAt（ISO）、locale（"zh-HK"）、title、
executiveSummary（約180-260字）、
geopolitics／financeCurrency／chinaHongKong 各為 {headline, analysis 約120-200字}、
sectorRotation：4-6項 {theme, observation, implication, relatedSectors[]}、
watchlist：3-5條、closingNote。
重點寫板塊輪動機制（油價／黃金、新股潮、息口、人民幣／AH 等）。
背景資料：${JSON.stringify(ctx)}`;

  const json = (await callLlmJson(system, prompt, 0.45)) as Partial<WeeklyOutlook> | null;
  if (!json) {
    const outlook = heuristicOutlook(weekOf, locale, ctx);
    await writeOutlook(outlook);
    return outlook;
  }

  try {
    const outlook = WeeklyOutlookSchema.parse({
      ...json,
      weekOf,
      createdAt,
      locale,
      meta: {
        writerMode: "llm-assisted",
        model,
        sourceDigestDates: ctx.sourceDigestDates,
        headlineCount: ctx.freshHeadlines.length,
        generatedAt: createdAt,
      },
    });
    await writeOutlook(outlook);
    return outlook;
  } catch {
    const outlook = heuristicOutlook(weekOf, locale, ctx);
    await writeOutlook(outlook);
    return outlook;
  }
}

export async function ensureWeeklyOutlook(
  locale: DigestLocale = DEFAULT_LOCALE,
): Promise<WeeklyOutlook> {
  const { readLatestOutlook } = await import("@/lib/outlook/store");
  const existing = await readLatestOutlook();
  if (existing) return existing;
  return generateWeeklyOutlook({ locale, forceHeuristic: !llmConfigured() });
}
