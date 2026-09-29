"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export function WorkspaceToolbar({ date }: { date?: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onGenerate(forceSeed = false) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/digest/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ forceSeed }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error || "生成失敗");
      }
      router.refresh();
      router.push("/");
    } catch (e) {
      setError(e instanceof Error ? e.message : "生成失敗");
    } finally {
      setLoading(false);
    }
  }

  const exportHref = date
    ? `/api/digest/export?format=md&date=${date}`
    : "/api/digest/export?format=md";

  return (
    <div className="sticky top-0 z-20 border-b border-[var(--line)] bg-[var(--paper)]/90 backdrop-blur">
      <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-3 px-4 py-3 md:px-6">
        <Link href="/" className="font-serif text-sm text-[var(--ink)]">
          大局觀工作台
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" onClick={() => onGenerate(false)} disabled={loading}>
            {loading ? "生成中…" : "重新生成"}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onGenerate(true)}
            disabled={loading}
          >
            種子演示
          </Button>
          <a
            href={exportHref}
            className="inline-flex h-8 items-center rounded-md border border-[var(--line)] px-3 text-xs text-[var(--ink)] hover:bg-[var(--mist)]"
          >
            匯出 Markdown
          </a>
          <Link
            href="/history"
            className="inline-flex h-8 items-center rounded-md px-3 text-xs text-[var(--ink-soft)] hover:bg-[var(--mist)]"
          >
            歷史
          </Link>
        </div>
      </div>
      {error ? (
        <p className="mx-auto max-w-3xl px-4 pb-3 text-sm text-red-700 md:px-6">{error}</p>
      ) : null}
      {loading ? (
        <div className="h-0.5 w-full overflow-hidden bg-[var(--mist)]">
          <div className="generate-bar h-full w-1/3 bg-[var(--accent)]" />
        </div>
      ) : null}
    </div>
  );
}
