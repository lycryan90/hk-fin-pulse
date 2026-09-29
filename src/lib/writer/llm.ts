import type { DigestItem, ScoredArticle } from "@/lib/digest/schema";
import { DigestItemSchema } from "@/lib/digest/schema";
import { PRODUCT_LABEL } from "@/lib/locale/labels";
import type { DigestLocale } from "@/lib/locale/types";
import type { DigestTheme } from "@/lib/pipeline/themes";
import {
  draftAllItems,
  weaveClosedLoop,
  weaveMacroIntro,
  weaveThinkingQuestions,
} from "@/lib/writer/heuristic";

export type WriterBundle = {
  writerMode: "heuristic" | "llm-assisted";
  hkItems: DigestItem[];
  intlItems: DigestItem[];
  macroIntro: string;
  thinkingQuestions: string[];
  closedLoopSummary: string;
  llmNote?: string;
};

const LLM_TIMEOUT_MS = 45_000;

export function llmConfigured(): boolean {
  if (process.env.LLM_ENABLED === "0" || process.env.LLM_ENABLED === "false") {
    return false;
  }
  return Boolean(process.env.LLM_API_KEY || process.env.OPENAI_API_KEY);
}

export function llmEndpoint(): { base: string; key: string; model: string } {
  const key = process.env.LLM_API_KEY || process.env.OPENAI_API_KEY || "";
  const base = (
    process.env.LLM_BASE_URL ||
    process.env.OPENAI_BASE_URL ||
    "https://api.openai.com/v1"
  ).replace(/\/$/, "");
  const model =
    process.env.LLM_MODEL || process.env.OPENAI_MODEL || "gpt-4o-mini";
  return { base, key, model };
}

function stripCodeFence(content: string): string {
  const trimmed = content.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return fenced?.[1]?.trim() ?? trimmed;
}

function systemPrompt(locale: DigestLocale): string {
  if (locale === "en-GB") {
    return `You are a Hong Kong macro editor writing ONLY in British English (UK spelling and grammar: favour, labour, summarise, organisation). Never mix in Chinese. No investment buy/sell advice. Output strict JSON. Summaries and macro analyses ~55-75 words each, with a Hong Kong or household transmission angle (rates, inflation, funding, regulation, borrowing). Closed-loop summary must follow: external shock → market pricing → Hong Kong transmission → households & institutions → outlook. Product label: ${PRODUCT_LABEL["en-GB"]}.`;
  }
  return `你是香港宏觀財經編輯，全文必須用香港繁體中文／港式用語（可用「嘅／喺／嚟講／唔係」等香港書面語習慣），禁止夾雜英文句子或英文標題原文。禁止投資買賣建議。輸出嚴格 JSON。概要與宏觀分析各約80-100字，必須含香港或普通人傳導視角。閉環總結按：外部衝擊→市場定價→香港傳導→民生與制度→展望。產品名稱：${PRODUCT_LABEL["zh-HK"]}。`;
}

async function chatJson(prompt: string, locale: DigestLocale): Promise<unknown | null> {
  if (!llmConfigured()) return null;
  const { base, key, model } = llmEndpoint();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), LLM_TIMEOUT_MS);
  try {
    const res = await fetch(`${base}/chat/completions`, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0.4,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: systemPrompt(locale) },
          { role: "user", content: prompt },
        ],
      }),
    });
    if (!res.ok) {
      console.warn(`[llm] HTTP ${res.status} from ${base}`);
      return null;
    }
    const data = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const content = data.choices?.[0]?.message?.content;
    if (!content) return null;
    return JSON.parse(stripCodeFence(content));
  } catch (err) {
    console.warn("[llm] request failed, falling back to heuristic", err);
    return null;
  } finally {
    clearTimeout(timer);
  }
}

function coalesceItems(
  llmItems: unknown,
  fallback: DigestItem[],
): DigestItem[] | null {
  if (!Array.isArray(llmItems) || llmItems.length !== 10) return null;
  const out: DigestItem[] = [];
  for (let i = 0; i < 10; i++) {
    const merged = { ...fallback[i], ...(llmItems[i] as object) };
    const parsed = DigestItemSchema.safeParse(merged);
    if (!parsed.success) return null;
    out.push(parsed.data);
  }
  return out;
}

export async function writeDigestCopy(
  hk: ScoredArticle[],
  intl: ScoredArticle[],
  themes: DigestTheme[],
  locale: DigestLocale = "zh-HK",
): Promise<WriterBundle> {
  const heuristicItems = draftAllItems(hk, intl, locale);
  const heuristic: WriterBundle = {
    writerMode: "heuristic",
    ...heuristicItems,
    macroIntro: weaveMacroIntro(
      themes,
      heuristicItems.hkItems,
      heuristicItems.intlItems,
      locale,
    ),
    thinkingQuestions: weaveThinkingQuestions(themes, locale),
    closedLoopSummary: weaveClosedLoop(
      themes,
      heuristicItems.hkItems,
      heuristicItems.intlItems,
      locale,
    ),
  };

  if (!llmConfigured()) {
    return {
      ...heuristic,
      llmNote:
        locale === "en-GB"
          ? "LLM not configured; using heuristic British English writer"
          : "LLM 未設定，使用港式中文啟發式寫手",
    };
  }

  const { model, base } = llmEndpoint();
  const payload = {
    locale,
    themes,
    hk: hk.map((a, i) => ({
      id: locale === "en-GB" ? `HK ${i + 1}` : `港 ${i + 1}`,
      title: a.title,
      summaryHint: a.summary,
      source: a.source,
      category: a.category,
      link: a.link,
      themeIds: a.themeIds,
    })),
    intl: intl.map((a, i) => ({
      id: locale === "en-GB" ? `INT ${i + 1}` : `國 ${i + 1}`,
      title: a.title,
      summaryHint: a.summary,
      source: a.source,
      category: a.category,
      link: a.link,
      themeIds: a.themeIds,
    })),
  };

  const prompt =
    locale === "en-GB"
      ? `Generate a full big-picture digest JSON in British English only (no Chinese). Fields: hkItems/intlItems (10 each) with id,region,category,source,sourceUrl,title,summary,macroAnalysis,civilianLine,themeIds; plus macroIntro, thinkingQuestions (exactly 3), closedLoopSummary. Localise any Chinese source titles into natural British English. News: ${JSON.stringify(payload)}`
      : `生成完整大局觀 digest JSON，全文港式繁中，禁止英文夾雜；英文來源標題要改寫成中文標題。欄位：hkItems/intlItems（各10則）含 id,region,category,source,sourceUrl,title,summary,macroAnalysis,civilianLine,themeIds；另含 macroIntro, thinkingQuestions(恰好3條), closedLoopSummary。新聞：${JSON.stringify(payload)}`;

  const json = (await chatJson(prompt, locale)) as Partial<WriterBundle> | null;
  if (!json) {
    return {
      ...heuristic,
      llmNote:
        locale === "en-GB"
          ? `LLM call failed (${base} / ${model}); fell back to heuristic`
          : `LLM 呼叫失敗（${base} / ${model}），已回退啟發式`,
    };
  }

  const hkItems = coalesceItems(json.hkItems, heuristic.hkItems);
  const intlItems = coalesceItems(json.intlItems, heuristic.intlItems);
  if (!hkItems || !intlItems || !json.macroIntro || !json.closedLoopSummary) {
    return {
      ...heuristic,
      llmNote:
        locale === "en-GB"
          ? "LLM payload incomplete; fell back to heuristic"
          : "LLM 回傳結構不完整，已回退啟發式",
    };
  }

  const thinkingQuestions = Array.isArray(json.thinkingQuestions)
    ? json.thinkingQuestions.filter((q) => typeof q === "string").slice(0, 3)
    : [];
  while (thinkingQuestions.length < 3) {
    thinkingQuestions.push(heuristic.thinkingQuestions[thinkingQuestions.length]!);
  }

  return {
    writerMode: "llm-assisted",
    hkItems,
    intlItems,
    macroIntro: json.macroIntro,
    thinkingQuestions,
    closedLoopSummary: json.closedLoopSummary,
    llmNote:
      locale === "en-GB" ? `LLM enabled (${model})` : `LLM 已啟用（${model}）`,
  };
}
