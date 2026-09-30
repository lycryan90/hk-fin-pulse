"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ExportPdfButton } from "@/components/digest/export-pdf-button";
import { ReadAloud } from "@/components/digest/read-aloud";
import type { Digest } from "@/lib/digest/schema";
import { UI } from "@/lib/locale/labels";
import {
  DEFAULT_LOCALE,
  isDigestLocale,
  type DigestLocale,
} from "@/lib/locale/types";

const STORAGE_KEY = "hk-fin-pulse-locale";

export function WorkspaceToolbar({ digest }: { digest?: Digest | null }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [locale, setLocale] = useState<DigestLocale>(
    digest?.locale ?? DEFAULT_LOCALE,
  );

  useEffect(() => {
    if (digest?.locale) {
      setLocale(digest.locale);
      return;
    }
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (isDigestLocale(saved)) setLocale(saved);
    } catch {
      /* ignore */
    }
  }, [digest?.locale]);

  function changeLocale(next: DigestLocale) {
    setLocale(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
  }

  async function onRescan() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/digest/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locale }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error || UI[locale].generateFailed);
      }
      router.refresh();
      router.push("/");
    } catch (e) {
      setError(e instanceof Error ? e.message : UI[locale].generateFailed);
    } finally {
      setLoading(false);
    }
  }

  const t = UI[locale];
  const rescanLabel = locale === "en-GB" ? "Rescan" : "重搜";
  const settingsLabel = locale === "en-GB" ? "Settings" : "設定";

  return (
    <div className="no-print sticky top-0 z-20 border-b border-[var(--line)]/80 bg-[var(--paper)]/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-2xl items-center justify-between gap-3 px-5 py-3">
        <Link href="/" className="font-serif text-[15px] tracking-wide text-[var(--ink)]">
          {t.workspace}
        </Link>
        <div className="flex flex-wrap items-center justify-end gap-1 text-xs">
          <button
            type="button"
            className={`px-1.5 py-1 ${locale === "zh-HK" ? "text-[var(--ink)]" : "text-[var(--muted)]"}`}
            onClick={() => changeLocale("zh-HK")}
          >
            {t.localeZh}
          </button>
          <span className="text-[var(--line)]">/</span>
          <button
            type="button"
            className={`px-1.5 py-1 ${locale === "en-GB" ? "text-[var(--ink)]" : "text-[var(--muted)]"}`}
            onClick={() => changeLocale("en-GB")}
          >
            {t.localeEn}
          </button>
          {digest ? <ReadAloud digest={digest} /> : null}
          <Button size="sm" variant="ghost" onClick={onRescan} disabled={loading}>
            {loading ? t.generating : rescanLabel}
          </Button>
          {digest ? <ExportPdfButton label="PDF" /> : null}
          <Link
            href="/outlook"
            className="px-1.5 py-1 text-[var(--muted)] hover:text-[var(--ink)]"
          >
            {locale === "en-GB" ? "Outlook" : "趨勢"}
          </Link>
          <Link
            href="/history"
            className="px-1.5 py-1 text-[var(--muted)] hover:text-[var(--ink)]"
          >
            {t.history}
          </Link>
          <Link
            href="/settings"
            className="px-1.5 py-1 text-[var(--muted)] hover:text-[var(--ink)]"
          >
            {settingsLabel}
          </Link>
        </div>
      </div>
      {error ? (
        <p className="mx-auto max-w-2xl px-5 pb-2 text-xs text-red-700">{error}</p>
      ) : null}
      {loading ? (
        <div className="h-px w-full overflow-hidden bg-[var(--mist)]">
          <div className="generate-bar h-full w-1/3 bg-[var(--accent)]" />
        </div>
      ) : null}
    </div>
  );
}
