import type { DayOverDayDiff } from "@/lib/digest/compare";
import Link from "next/link";

export function DayOverDay({ diff }: { diff: DayOverDayDiff | null }) {
  if (!diff) {
    return (
      <section className="mb-10 rounded-sm border border-dashed border-[var(--line)] px-5 py-4 text-sm text-[var(--muted)]">
        尚無更早的本地報告可對照。連續兩日執行 <code className="text-[var(--ink-soft)]">npm run digest</code>{" "}
        後，此處會顯示主線與閉環變化。
      </section>
    );
  }

  return (
    <section className="animate-fade-up mb-10 rounded-sm border border-[var(--line)] bg-[var(--mist)]/60 px-5 py-5">
      <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-serif text-lg text-[var(--ink)]">與昨日對照</h2>
        <Link
          href={`/history/${diff.previousDate}`}
          className="text-xs text-[var(--accent)] underline underline-offset-4"
        >
          查看 {diff.previousDate}
        </Link>
      </div>
      <p className="text-[15px] leading-7 text-[var(--ink-soft)]">{diff.summary}</p>
      <div className="mt-3 flex flex-wrap gap-2 text-xs">
        {diff.addedThemes.map((t) => (
          <span
            key={`a-${t}`}
            className="border border-[var(--accent)]/40 bg-[var(--paper)] px-2 py-1 text-[var(--accent)]"
          >
            + {t}
          </span>
        ))}
        {diff.removedThemes.map((t) => (
          <span
            key={`r-${t}`}
            className="border border-[var(--line)] bg-[var(--paper)] px-2 py-1 text-[var(--muted)] line-through"
          >
            {t}
          </span>
        ))}
      </div>
    </section>
  );
}
