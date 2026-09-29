import type { DayOverDayDiff } from "@/lib/digest/compare";
import type { Digest } from "@/lib/digest/schema";
import { DISCLAIMER_LONG, DISCLAIMER_SHORT } from "@/lib/digest/disclaimer";
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
  const disclaimerLong =
    locale === "en-GB"
      ? "Disclaimer: This report is for macro reading and education only. It is not investment advice, financial advice, or an invitation to trade. Markets involve risk; readers should form their own view and consult a licensed professional where needed."
      : DISCLAIMER_LONG;
  const disclaimerShort =
    locale === "en-GB"
      ? "Disclaimer: For macro reading and education only — not investment advice."
      : DISCLAIMER_SHORT;

  return (
    <div className="digest-report mx-auto max-w-3xl px-4 pb-20 pt-8 md:px-6">
      <aside className="mb-8 border border-[var(--line)] bg-[var(--paper)] px-4 py-3 text-sm leading-6 text-[var(--ink-soft)]">
        {disclaimerLong}
      </aside>

      <header className="animate-fade-up mb-10">
        <p className="text-sm tracking-[0.2em] text-[var(--muted)]">
          {locale === "en-GB" ? "Hong Kong 10 · International 10" : "港聞 10 · 國際 10"}
        </p>
        <h1 className="mt-2 font-serif text-4xl leading-tight text-[var(--ink)] md:text-5xl">
          {digest.date}
        </h1>
        <p className="mt-3 font-serif text-xl text-[var(--accent)] md:text-2xl">
          {digest.label}
        </p>
        <p className="mt-2 text-xs uppercase tracking-wider text-[var(--muted)]">
          {digest.locale ?? "zh-HK"}
        </p>
      </header>

      <section className="animate-fade-up mb-8 delay-1">
        <div className="flex flex-wrap gap-2">
          {digest.themes.map((theme) => (
            <span
              key={theme.id}
              className="theme-chip border border-[var(--line)] bg-[var(--mist)] px-3 py-1 text-sm text-[var(--ink-soft)]"
            >
              {theme.label}
            </span>
          ))}
        </div>
      </section>

      <DayOverDay diff={diff} locale={locale} />

      <section className="animate-fade-up mb-12 delay-2">
        <h2 className="mb-3 font-serif text-lg text-[var(--ink)]">{t.macroIntro}</h2>
        <p className="text-[16px] leading-8 text-[var(--ink-soft)] md:text-[17px]">
          {digest.macroIntro}
        </p>
      </section>

      <section className="mb-14 rounded-sm bg-[var(--mist)]/80 px-5 py-6">
        <h2 className="mb-4 font-serif text-lg text-[var(--ink)]">{t.thinking}</h2>
        <ol className="space-y-3">
          {digest.thinkingQuestions.map((q, i) => (
            <li key={i} className="flex gap-3 text-[15px] leading-7 text-[var(--ink-soft)]">
              <span className="mt-0.5 font-serif text-[var(--accent)]">{i + 1}</span>
              <span>{q}</span>
            </li>
          ))}
        </ol>
      </section>

      <section className="mb-14">
        <h2 className="mb-2 font-serif text-2xl text-[var(--ink)]">{t.hkSection}</h2>
        <p className="mb-4 text-sm text-[var(--muted)]">
          {locale === "en-GB"
            ? "Finance · regulation · Hong Kong dollar pricing"
            : "金融 · 監管 · 港元定價視角"}
        </p>
        {digest.hkItems.map((item) => (
          <NewsItem key={item.id} item={item} locale={locale} />
        ))}
      </section>

      <section className="mb-14">
        <h2 className="mb-2 font-serif text-2xl text-[var(--ink)]">{t.intlSection}</h2>
        <p className="mb-4 text-sm text-[var(--muted)]">
          {locale === "en-GB"
            ? "Rates · commodities · geopolitics · FX transmission"
            : "利率 · 商品 · 地緣 · 貨幣對民生傳導"}
        </p>
        {digest.intlItems.map((item) => (
          <NewsItem key={item.id} item={item} locale={locale} />
        ))}
      </section>

      <section className="mb-10 border-t border-[var(--line)] pt-8">
        <h2 className="mb-3 font-serif text-xl text-[var(--ink)]">{t.closedLoop}</h2>
        <p className="text-[16px] leading-8 text-[var(--ink-soft)] md:text-[17px]">
          {digest.closedLoopSummary}
        </p>
      </section>

      <footer className="text-xs leading-6 text-[var(--muted)]">
        {locale === "en-GB"
          ? `Preview from the latest digest API · createdAt ${digest.createdAt}`
          : `預覽頁由最新 digest API 產生 · createdAt ${digest.createdAt}`}
        <br />
        {locale === "en-GB"
          ? `Mode ${digest.meta.writerMode} · fetched ${digest.meta.ingestStats.fetched} · seed-filled ${digest.meta.ingestStats.seedFilled}`
          : `生成模式 ${digest.meta.writerMode} · 抓取 ${digest.meta.ingestStats.fetched} · 種子補位 ${digest.meta.ingestStats.seedFilled}`}
        <br />
        {disclaimerShort}
      </footer>
    </div>
  );
}
