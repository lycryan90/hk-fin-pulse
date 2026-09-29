import type { DayOverDayDiff } from "@/lib/digest/compare";
import { UI } from "@/lib/locale/labels";
import type { DigestLocale } from "@/lib/locale/types";
import Link from "next/link";

export function DayOverDay({
  diff,
  locale = "zh-HK",
}: {
  diff: DayOverDayDiff | null;
  locale?: DigestLocale;
}) {
  if (!diff) return null;
  const t = UI[locale];

  return (
    <section className="mb-12">
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <p className="text-xs tracking-[0.16em] text-[var(--muted)]">{t.vsYesterday}</p>
        <Link
          href={`/history/${diff.previousDate}`}
          className="text-xs text-[var(--muted)] hover:text-[var(--ink)]"
        >
          {diff.previousDate}
        </Link>
      </div>
      <p className="text-[15px] leading-7 text-[var(--ink-soft)]">{diff.summary}</p>
    </section>
  );
}
