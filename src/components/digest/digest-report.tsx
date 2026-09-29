import type { DayOverDayDiff } from "@/lib/digest/compare";
import type { Digest } from "@/lib/digest/schema";
import { DayOverDay } from "@/components/digest/day-over-day";
import { NewsItem } from "@/components/digest/news-item";
import { UI } from "@/lib/locale/labels";
import type { DigestLocale } from "@/lib/locale/types";

export function DigestReport({
  digest,
  diff = null,
}: {
  digest: Digest;
  diff?: DayOverDayDiff | null;
}) {
  const locale = (digest.locale ?? "zh-HK") as DigestLocale;
  const t = UI[locale];
  const disclaimer =
    locale === "en-GB"
      ? "For reading only — not investment advice."
      : "僅供閱讀，不構成投資建議。";

  return (
    <div className="mx-auto max-w-2xl px-5 pb-24 pt-12">
      <header className="animate-fade-up mb-12">
        <p className="font-serif text-3xl leading-tight tracking-tight text-[var(--ink)] md:text-4xl">
          {digest.label}
        </p>
        <p className="mt-3 text-sm text-[var(--muted)]">{digest.date}</p>
        <p className="mt-6 text-[15px] leading-7 text-[var(--ink-soft)]">
          {digest.themes.map((theme) => theme.label).join(" · ")}
        </p>
      </header>

      <DayOverDay diff={diff} locale={locale} />

      <section className="animate-fade-up mb-14">
        <p className="mb-3 text-xs tracking-[0.16em] text-[var(--muted)]">{t.macroIntro}</p>
        <p className="text-[16px] leading-8 text-[var(--ink)] md:text-[17px]">
          {digest.macroIntro}
        </p>
      </section>

      <section className="mb-14">
        <p className="mb-4 text-xs tracking-[0.16em] text-[var(--muted)]">{t.thinking}</p>
        <ol className="space-y-4">
          {digest.thinkingQuestions.map((q, i) => (
            <li key={i} className="flex gap-3 text-[15px] leading-7 text-[var(--ink-soft)]">
              <span className="text-[var(--muted)]">{i + 1}</span>
              <span>{q}</span>
            </li>
          ))}
        </ol>
      </section>

      <section className="mb-16">
        <p className="mb-2 text-xs tracking-[0.16em] text-[var(--muted)]">{t.hkSection}</p>
        {digest.hkItems.map((item) => (
          <NewsItem key={item.id} item={item} locale={locale} />
        ))}
      </section>

      <section className="mb-16">
        <p className="mb-2 text-xs tracking-[0.16em] text-[var(--muted)]">{t.intlSection}</p>
        {digest.intlItems.map((item) => (
          <NewsItem key={item.id} item={item} locale={locale} />
        ))}
      </section>

      <section className="mb-14 border-t border-[var(--line)]/70 pt-10">
        <p className="mb-3 text-xs tracking-[0.16em] text-[var(--muted)]">{t.closedLoop}</p>
        <p className="text-[16px] leading-8 text-[var(--ink)] md:text-[17px]">
          {digest.closedLoopSummary}
        </p>
      </section>

      <footer className="text-xs text-[var(--muted)]">{disclaimer}</footer>
    </div>
  );
}
