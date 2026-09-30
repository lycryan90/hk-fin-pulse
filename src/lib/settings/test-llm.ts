export type LlmTestInput = {
  llmBaseUrl: string;
  llmApiKey: string;
  llmModel: string;
  llmTimeoutMs: number;
  llmProvider?: "cloud" | "local";
};

export type LlmTestResult = {
  ok: boolean;
  latencyMs: number;
  baseUrl: string;
  model: string;
  provider?: "cloud" | "local";
  reply?: string;
  error?: string;
  hint?: string;
};

function normalizeBase(url: string): string {
  return url.trim().replace(/\/$/, "");
}

function hintForError(
  message: string,
  provider?: "cloud" | "local",
): string | undefined {
  const m = message.toLowerCase();
  if (
    m.includes("econnrefused") ||
    m.includes("fetch failed") ||
    m.includes("network")
  ) {
    return provider === "local"
      ? "本機服務可能未開。若用 Ollama，先喺終端執行：ollama serve"
      : "連唔到雲端 API，請檢查網絡／Base URL。";
  }
  if (m.includes("404")) {
    return "路徑可能錯。Ollama 要用 …/v1（例如 http://127.0.0.1:11434/v1）。";
  }
  if (m.includes("401") || m.includes("403")) {
    return "API Key 可能唔啱。本地 Ollama 可填 ollama。";
  }
  if (m.includes("model") || m.includes("not found")) {
    return "Model 名稱可能未下載。Ollama：ollama pull <模型名>";
  }
  if (m.includes("abort") || m.includes("timeout") || m.includes("逾時")) {
    return "逾時。可加大逾時，或換細啲嘅本機模型。";
  }
  return undefined;
}

/** Probe OpenAI-compatible chat/completions with a tiny prompt. */
export async function testLlmConnection(
  input: LlmTestInput,
): Promise<LlmTestResult> {
  const baseUrl = normalizeBase(input.llmBaseUrl || "");
  const model = (input.llmModel || "").trim();
  const key = (input.llmApiKey || "").trim() || "local";
  const timeoutMs = Math.min(
    Math.max(Number(input.llmTimeoutMs) || 30000, 5000),
    300000,
  );
  const provider = input.llmProvider;

  if (!baseUrl) {
    return {
      ok: false,
      latencyMs: 0,
      baseUrl,
      model,
      provider,
      error: "未填 API Base URL",
      hint: "本地可填 http://127.0.0.1:11434/v1",
    };
  }
  if (!model) {
    return {
      ok: false,
      latencyMs: 0,
      baseUrl,
      model,
      provider,
      error: "未填 Model",
      hint: "例如 llama3.2（要先 ollama pull）",
    };
  }

  const started = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0,
        max_tokens: 32,
        messages: [
          {
            role: "user",
            content: "Reply with exactly one word: OK. No other text.",
          },
        ],
      }),
    });

    const latencyMs = Date.now() - started;
    const rawText = await res.text();
    let parsed: {
      choices?: { message?: { content?: string } }[];
      error?: { message?: string };
    } = {};
    try {
      parsed = JSON.parse(rawText) as typeof parsed;
    } catch {
      /* keep raw */
    }

    if (!res.ok) {
      const errMsg =
        parsed.error?.message || rawText.slice(0, 240) || `HTTP ${res.status}`;
      return {
        ok: false,
        latencyMs,
        baseUrl,
        model,
        provider,
        error: `HTTP ${res.status}: ${errMsg}`,
        hint: hintForError(errMsg, provider),
      };
    }

    const reply = (parsed.choices?.[0]?.message?.content || "").trim();
    if (!reply) {
      return {
        ok: false,
        latencyMs,
        baseUrl,
        model,
        provider,
        error: "有回應但冇內容（choices 空白）",
        hint: "檢查 model 名是否正確、服務是否支援 /v1/chat/completions",
      };
    }

    return {
      ok: true,
      latencyMs,
      baseUrl,
      model,
      provider,
      reply: reply.slice(0, 200),
    };
  } catch (err) {
    const latencyMs = Date.now() - started;
    const message =
      err instanceof Error
        ? err.name === "AbortError"
          ? `逾時（>${timeoutMs}ms）`
          : err.message
        : "連線失敗";
    return {
      ok: false,
      latencyMs,
      baseUrl,
      model,
      provider,
      error: message,
      hint: hintForError(message, provider),
    };
  } finally {
    clearTimeout(timer);
  }
}
