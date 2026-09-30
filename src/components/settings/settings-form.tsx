"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  GEMINI_PRESET,
  LOCAL_LLM_PRESET,
  type AppSettings,
} from "@/lib/settings/schema";

type PublicSettings = Omit<AppSettings, "llmApiKey"> & {
  llmApiKey: string;
  llmApiKeySet: boolean;
};

export function SettingsForm({ initial }: { initial: PublicSettings }) {
  const [llmEnabled, setLlmEnabled] = useState(initial.llmEnabled);
  const [llmProvider, setLlmProvider] = useState(initial.llmProvider);
  const [llmApiKey, setLlmApiKey] = useState("");
  const [llmBaseUrl, setLlmBaseUrl] = useState(initial.llmBaseUrl);
  const [llmModel, setLlmModel] = useState(initial.llmModel);
  const [llmTimeoutMs, setLlmTimeoutMs] = useState(initial.llmTimeoutMs);
  const [keySet, setKeySet] = useState(initial.llmApiKeySet);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [testDetail, setTestDetail] = useState<string | null>(null);

  function applyLocalPreset() {
    setLlmProvider("local");
    setLlmEnabled(true);
    setLlmBaseUrl(LOCAL_LLM_PRESET.llmBaseUrl);
    setLlmModel(LOCAL_LLM_PRESET.llmModel);
    setLlmApiKey(LOCAL_LLM_PRESET.llmApiKey);
  }

  function applyGeminiPreset() {
    setLlmProvider("cloud");
    setLlmEnabled(true);
    setLlmBaseUrl(GEMINI_PRESET.llmBaseUrl);
    setLlmModel(GEMINI_PRESET.llmModel);
  }

  function formPayload(includeMaskedKey = true): Record<string, unknown> {
    const body: Record<string, unknown> = {
      llmEnabled,
      llmProvider,
      llmBaseUrl,
      llmModel,
      llmTimeoutMs,
    };
    if (llmApiKey.trim()) body.llmApiKey = llmApiKey.trim();
    else if (includeMaskedKey && keySet) body.llmApiKey = "••••xxxx";
    return body;
  }

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    setError(null);
    setTestDetail(null);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formPayload()),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "儲存失敗");
      setKeySet(Boolean(data.llmApiKeySet));
      setLlmApiKey("");
      setMessage("已儲存。");
    } catch (err) {
      setError(err instanceof Error ? err.message : "儲存失敗");
    } finally {
      setSaving(false);
    }
  }

  async function onTest() {
    setTesting(true);
    setMessage(null);
    setError(null);
    setTestDetail(null);
    try {
      const res = await fetch("/api/settings/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formPayload()),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        latencyMs?: number;
        reply?: string;
        error?: string;
        hint?: string;
        model?: string;
        baseUrl?: string;
      };
      if (data.ok) {
        setMessage(`連線成功（${data.latencyMs ?? "?"} ms）`);
        setTestDetail(
          [
            `Model: ${data.model || llmModel}`,
            `URL: ${data.baseUrl || llmBaseUrl}`,
            data.reply ? `回覆：${data.reply}` : null,
          ]
            .filter(Boolean)
            .join("\n"),
        );
      } else {
        setError(data.error || "測試失敗");
        setTestDetail(
          [data.hint, data.baseUrl ? `URL: ${data.baseUrl}` : null]
            .filter(Boolean)
            .join("\n") || null,
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "測試失敗");
    } finally {
      setTesting(false);
    }
  }

  const field =
    "mt-1 w-full border border-[var(--line)] bg-[var(--paper)] px-3 py-2 text-sm text-[var(--ink)] outline-none focus:border-[var(--ink)]";

  return (
    <form onSubmit={onSave} className="mt-10 space-y-8">
      <label className="flex items-center gap-3 text-sm text-[var(--ink)]">
        <input
          type="checkbox"
          checked={llmEnabled}
          onChange={(e) => setLlmEnabled(e.target.checked)}
        />
        啟用 LLM（關閉則只用規則寫手）
      </label>

      <fieldset className="space-y-3">
        <legend className="text-xs tracking-[0.16em] text-[var(--muted)]">模式</legend>
        <div className="flex gap-4 text-sm">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="provider"
              checked={llmProvider === "cloud"}
              onChange={() => setLlmProvider("cloud")}
            />
            雲端 API
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="provider"
              checked={llmProvider === "local"}
              onChange={() => setLlmProvider("local")}
            />
            本地 LLM
          </label>
        </div>
        <div className="flex flex-wrap gap-2 pt-1">
          <Button type="button" size="sm" variant="outline" onClick={applyGeminiPreset}>
            Gemini 預設
          </Button>
          <Button type="button" size="sm" variant="outline" onClick={applyLocalPreset}>
            Ollama 預設
          </Button>
        </div>
      </fieldset>

      <label className="block text-sm">
        <span className="text-[var(--muted)]">API Base URL</span>
        <input
          className={field}
          value={llmBaseUrl}
          onChange={(e) => setLlmBaseUrl(e.target.value)}
          placeholder={
            llmProvider === "local"
              ? "http://127.0.0.1:11434/v1"
              : "https://api.openai.com/v1"
          }
        />
      </label>

      <label className="block text-sm">
        <span className="text-[var(--muted)]">
          API Key{keySet ? "（已設定，留空則保留）" : ""}
        </span>
        <input
          className={field}
          type="password"
          autoComplete="off"
          value={llmApiKey}
          onChange={(e) => setLlmApiKey(e.target.value)}
          placeholder={keySet ? "••••••••" : llmProvider === "local" ? "ollama" : ""}
        />
      </label>

      <label className="block text-sm">
        <span className="text-[var(--muted)]">Model</span>
        <input
          className={field}
          value={llmModel}
          onChange={(e) => setLlmModel(e.target.value)}
          placeholder={llmProvider === "local" ? "llama3.2" : "gpt-4o-mini"}
        />
      </label>

      <label className="block text-sm">
        <span className="text-[var(--muted)]">逾時（毫秒）</span>
        <input
          className={field}
          type="number"
          min={15000}
          max={300000}
          step={1000}
          value={llmTimeoutMs}
          onChange={(e) => setLlmTimeoutMs(Number(e.target.value) || 90000)}
        />
      </label>

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={saving || testing}>
          {saving ? "儲存中…" : "儲存"}
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={saving || testing}
          onClick={onTest}
        >
          {testing ? "測試中…" : llmProvider === "local" ? "測試本地 LLM" : "測試連線"}
        </Button>
      </div>

      {message ? (
        <p className="text-sm text-[var(--accent)]">{message}</p>
      ) : null}
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      {testDetail ? (
        <pre className="whitespace-pre-wrap rounded-none border border-[var(--line)] bg-[var(--mist)]/40 px-3 py-2 text-xs text-[var(--muted)]">
          {testDetail}
        </pre>
      ) : null}

      {llmProvider === "local" ? (
        <p className="text-xs leading-relaxed text-[var(--muted)]">
          測試會向 Base URL 發送一條極短對話。Ollama 請先執行{" "}
          <code className="text-[var(--ink)]">ollama serve</code> 同{" "}
          <code className="text-[var(--ink)]">ollama pull {llmModel || "llama3.2"}</code>
          。
        </p>
      ) : null}
    </form>
  );
}
