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
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      const body: Record<string, unknown> = {
        llmEnabled,
        llmProvider,
        llmBaseUrl,
        llmModel,
        llmTimeoutMs,
      };
      if (llmApiKey.trim()) body.llmApiKey = llmApiKey.trim();
      else if (keySet) body.llmApiKey = "••••xxxx";

      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
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

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={saving}>
          {saving ? "儲存中…" : "儲存"}
        </Button>
        {message ? <span className="text-sm text-[var(--accent)]">{message}</span> : null}
        {error ? <span className="text-sm text-red-700">{error}</span> : null}
      </div>
    </form>
  );
}
