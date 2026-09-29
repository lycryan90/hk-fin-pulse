"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ReadAloud } from "@/components/digest/read-aloud";
import type { Digest } from "@/lib/digest/schema";
import { UI } from "@/lib/locale/labels";
import {
  DEFAULT_LOCALE,
  isDigestLocale,
  type DigestLocale,
} from "@/lib/locale/types";

const STORAGE_KEY = "hk-fin-pulse-locale";

export function WorkspaceToolbar({
  digest,
}: {
  digest?: Digest | null;
  date?: string;
}) {
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

  async function onGenerate(forceSeed = false) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/digest/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ forceSeed, locale }),
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
  const date = digest?.date;
  const exportHref = date
    ? `/api/digest/export?format=md&date=${date}`
    : "/api/digest/export?format=md";

  return (
    <div className="sticky top-0 z-20 border-b border-[var(--line)] bg-[var(--paper)]/90 backdrop-blur">
      <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-3 px-4 py-3 md:px-6">
        <Link href="/" className="font-serif text-sm text-[var(--ink)]">
          {t.workspace}
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-md border border-[var(--line)] p-0.5 text-xs">
            <button
              type="button"
              className={`rounded px-2 py-1 ${locale === "zh-HK" ? "bg-[var(--ink)] text-[var(--paper)]" : "text-[var(--ink-soft)]"}`}
              onClick={() => changeLocale("zh-HK")}
            >
              {t.localeZh}
            </button>
            <button
              type="button"
              className={`rounded px-2 py-1 ${locale === "en-GB" ? "bg-[var(--ink)] text-[var(--paper)]" : "text-[var(--ink-soft)]"}`}
              onClick={() => changeLocale("en-GB")}
            >
              {t.localeEn}
            </button>
          </div>
          {digest ? <ReadAloud digest={digest} /> : null}
          <Button size="sm" onClick={() => onGenerate(false)} disabled={loading}>
            {loading ? t.generating : t.regenerate}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onGenerate(true)}
            disabled={loading}
          >
            {t.seedDemo}
          </Button>
          <a
            href={exportHref}
            className="inline-flex h-8 items-center rounded-md border border-[var(--line)] px-3 text-xs text-[var(--ink)] hover:bg-[var(--mist)]"
          >
            {t.exportMd}
          </a>
          <Link
            href="/history"
            className="inline-flex h-8 items-center rounded-md px-3 text-xs text-[var(--ink-soft)] hover:bg-[var(--mist)]"
          >
            {t.history}
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
