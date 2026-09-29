import type { DigestItem, ScoredArticle } from "@/lib/digest/schema";
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
};

function llmConfigured(): boolean {
  return Boolean(process.env.LLM_API_KEY || process.env.OPENAI_API_KEY);
}

function llmEndpoint(): { base: string; key: string; model: string } {
  const key = process.env.LLM_API_KEY || process.env.OPENAI_API_KEY || "";
  const base = (process.env.LLM_BASE_URL || "https://api.openai.com/v1").replace(
    /\/$/,
    "",
  );
  const model = process.env.LLM_MODEL || "gpt-4o-mini";
  return { base, key, model };
}

async function chatJson(prompt: string): Promise<unknown | null> {
  if (!llmConfigured()) return null;
  const { base, key, model } = llmEndpoint();
  try {
    const res = await fetch(`${base}/chat/completions`, {
      method: "POST",
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
              "你是香港宏觀財經編輯，只用繁體中文。禁止投資買賣建議。輸出嚴格 JSON。概要與宏觀分析各約80-100字，必須含香港或普通人傳導視角（利率、通脹、資金、監管、借貸等）。",
          },
          { role: "user", content: prompt },
        ],
      }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const content = data.choices?.[0]?.message?.content;
    if (!content) return null;
    return JSON.parse(content);
  } catch {
    return null;
  }
}

export async function writeDigestCopy(
  hk: ScoredArticle[],
  intl: ScoredArticle[],
  themes: DigestTheme[],
): Promise<WriterBundle> {
  const heuristicItems = draftAllItems(hk, intl);
  const heuristic = {
    writerMode: "heuristic" as const,
    ...heuristicItems,
    macroIntro: weaveMacroIntro(themes, heuristicItems.hkItems, heuristicItems.intlItems),
    thinkingQuestions: weaveThinkingQuestions(themes),
    closedLoopSummary: weaveClosedLoop(
      themes,
      heuristicItems.hkItems,
      heuristicItems.intlItems,
    ),
  };

  if (!llmConfigured()) return heuristic;

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
hkItems/intlItems 陣列元素含 id,region,category,source,sourceUrl,title,summary,macroAnalysis,civilianLine,themeIds；
另含 macroIntro, thinkingQuestions(3條), closedLoopSummary。
閉環總結須按：外部衝擊→市場定價→香港傳導→民生與制度→展望。
新聞：${JSON.stringify(payload)}`;

  const json = (await chatJson(prompt)) as Partial<WriterBundle> | null;
  if (
    !json ||
    !Array.isArray(json.hkItems) ||
    json.hkItems.length !== 10 ||
    !Array.isArray(json.intlItems) ||
    json.intlItems.length !== 10 ||
    !json.macroIntro ||
    !Array.isArray(json.thinkingQuestions) ||
    !json.closedLoopSummary
  ) {
    return heuristic;
  }

  return {
    writerMode: "llm-assisted",
    hkItems: json.hkItems,
    intlItems: json.intlItems,
    macroIntro: json.macroIntro,
    thinkingQuestions: json.thinkingQuestions.slice(0, 3),
    closedLoopSummary: json.closedLoopSummary,
  };
}
