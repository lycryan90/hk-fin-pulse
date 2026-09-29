import type { DigestItem, ScoredArticle } from "@/lib/digest/schema";
import { DigestItemSchema } from "@/lib/digest/schema";
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

async function chatJson(prompt: string): Promise<unknown | null> {
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
          {
            role: "system",
            content:
              "你是香港宏觀財經編輯，只用繁體中文。禁止投資買賣建議與個股推介。輸出嚴格 JSON。概要與宏觀分析各約80-100字，必須含香港或普通人傳導視角（利率、通脹、資金、監管、借貸等）。閉環總結按：外部衝擊→市場定價→香港傳導→民生與制度→展望。",
          },
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
): Promise<WriterBundle> {
  const heuristicItems = draftAllItems(hk, intl);
  const heuristic: WriterBundle = {
    writerMode: "heuristic",
    ...heuristicItems,
    macroIntro: weaveMacroIntro(themes, heuristicItems.hkItems, heuristicItems.intlItems),
    thinkingQuestions: weaveThinkingQuestions(themes),
    closedLoopSummary: weaveClosedLoop(
      themes,
      heuristicItems.hkItems,
      heuristicItems.intlItems,
    ),
  };

  if (!llmConfigured()) {
    return { ...heuristic, llmNote: "LLM 未設定，使用啟發式寫手" };
  }

  const { model, base } = llmEndpoint();
  const payload = {
    themes,
    hk: hk.map((a, i) => ({
      id: `港 ${i + 1}`,
      title: a.title,
      summaryHint: a.summary,
      source: a.source,
      category: a.category,
      link: a.link,
      themeIds: a.themeIds,
    })),
    intl: intl.map((a, i) => ({
      id: `國 ${i + 1}`,
      title: a.title,
      summaryHint: a.summary,
      source: a.source,
      category: a.category,
      link: a.link,
      themeIds: a.themeIds,
    })),
  };

  const prompt = `根據下列已選定新聞，生成大局觀 digest JSON，欄位：
hkItems/intlItems（各10則）元素含 id,region,category,source,sourceUrl,title,summary,macroAnalysis,civilianLine,themeIds；
另含 macroIntro, thinkingQuestions(恰好3條), closedLoopSummary。
新聞：${JSON.stringify(payload)}`;

  const json = (await chatJson(prompt)) as Partial<WriterBundle> | null;
  if (!json) {
    return {
      ...heuristic,
      llmNote: `LLM 呼叫失敗（${base} / ${model}），已回退啟發式`,
    };
  }

  const hkItems = coalesceItems(json.hkItems, heuristic.hkItems);
  const intlItems = coalesceItems(json.intlItems, heuristic.intlItems);
  if (!hkItems || !intlItems || !json.macroIntro || !json.closedLoopSummary) {
    return {
      ...heuristic,
      llmNote: "LLM 回傳結構不完整，已回退啟發式",
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
    llmNote: `LLM 已啟用（${model}）`,
  };
}
