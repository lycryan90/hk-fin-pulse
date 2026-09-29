import type { WeeklyOutlook } from "@/lib/outlook/schema";
import { UI } from "@/lib/locale/labels";
import type { DigestLocale } from "@/lib/locale/types";

export function OutlookReport({ outlook }: { outlook: WeeklyOutlook }) {
  const locale = outlook.locale as DigestLocale;
  const t = UI[locale];
  const disclaimer =
    locale === "en-GB"
      ? "For reading only — not investment advice."
      : "僅供閱讀，不構成投資建議。";

  const blocks = [
    {
      key: "geo",
      label: locale === "en-GB" ? "Geopolitics" : "地緣政治",
      block: outlook.geopolitics,
    },
    {
      key: "fin",
      label: locale === "en-GB" ? "Finance & currency" : "金融與貨幣",
      block: outlook.financeCurrency,
    },
    {
      key: "chk",
      label: locale === "en-GB" ? "China–Hong Kong" : "中港核心",
      block: outlook.chinaHongKong,
    },
  ];

  return (
    <div className="mx-auto max-w-2xl px-5 pb-24 pt-12">
      <header className="mb-12">
        <p className="font-serif text-3xl leading-tight tracking-tight text-[var(--ink)] md:text-4xl">
          {outlook.title}
        </p>
        <p className="mt-3 text-sm text-[var(--muted)]">
          {locale === "en-GB" ? "Week of" : "週期"} {outlook.weekOf}
          {outlook.meta.writerMode === "llm-assisted" ? " · LLM" : ""}
        </p>
      </header>

      <section className="mb-14">
        <p className="mb-3 text-xs tracking-[0.16em] text-[var(--muted)]">
          {locale === "en-GB" ? "Summary" : "總覽"}
        </p>
        <p className="text-[16px] leading-8 text-[var(--ink)] md:text-[17px]">
          {outlook.executiveSummary}
        </p>
      </section>

      {blocks.map((b) => (
        <section key={b.key} className="mb-12">
          <p className="mb-2 text-xs tracking-[0.16em] text-[var(--muted)]">{b.label}</p>
          <h2 className="font-serif text-xl text-[var(--ink)]">{b.block.headline}</h2>
          <p className="mt-3 text-[15px] leading-7 text-[var(--ink-soft)]">{b.block.analysis}</p>
        </section>
      ))}

      <section className="mb-14">
        <p className="mb-4 text-xs tracking-[0.16em] text-[var(--muted)]">
          {locale === "en-GB" ? "Sector rotation" : "板塊輪動"}
        </p>
        <div className="space-y-8">
          {outlook.sectorRotation.map((item) => (
            <article key={item.theme} className="border-t border-[var(--line)]/70 pt-6 first:border-t-0 first:pt-0">
              <h3 className="font-serif text-lg text-[var(--ink)]">{item.theme}</h3>
              <p className="mt-3 text-[15px] leading-7 text-[var(--ink-soft)]">{item.observation}</p>
              <p className="mt-3 text-[15px] leading-7 text-[var(--ink)]">{item.implication}</p>
              <p className="mt-3 text-xs text-[var(--muted)]">
                {item.relatedSectors.join(" · ")}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="mb-14">
        <p className="mb-3 text-xs tracking-[0.16em] text-[var(--muted)]">
          {locale === "en-GB" ? "Watch" : "留意"}
        </p>
        <ol className="space-y-3">
          {outlook.watchlist.map((w, i) => (
            <li key={w} className="flex gap-3 text-[15px] leading-7 text-[var(--ink-soft)]">
              <span className="text-[var(--muted)]">{i + 1}</span>
              <span>{w}</span>
            </li>
          ))}
        </ol>
      </section>

      <section className="mb-14 border-t border-[var(--line)]/70 pt-10">
        <p className="mb-3 text-xs tracking-[0.16em] text-[var(--muted)]">
          {locale === "en-GB" ? "Close" : "收束"}
        </p>
        <p className="text-[16px] leading-8 text-[var(--ink)]">{outlook.closingNote}</p>
      </section>

      <footer className="text-xs text-[var(--muted)]">
        {disclaimer}
        {outlook.meta.sourceDigestDates.length ? (
          <>
            {" · "}
            {locale === "en-GB" ? "Sources" : "取材"}{" "}
            {outlook.meta.sourceDigestDates.join(", ")}
          </>
        ) : null}
        <span className="sr-only">{t.closedLoop}</span>
      </footer>
    </div>
  );
}
