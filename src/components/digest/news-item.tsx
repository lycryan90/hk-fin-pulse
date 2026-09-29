import type { DigestItem } from "@/lib/digest/schema";
import type { DigestLocale } from "@/lib/locale/types";

export function NewsItem({
  item,
  locale = "zh-HK",
}: {
  item: DigestItem;
  locale?: DigestLocale;
}) {
  return (
    <article className="border-t border-[var(--line)]/70 py-7 first:border-t-0 first:pt-2">
      <div className="mb-2 flex flex-wrap items-baseline gap-x-3 text-xs text-[var(--muted)]">
        <span>{item.id}</span>
        <span>{item.source}</span>
        {item.sourceUrl ? (
          <a
            href={item.sourceUrl}
            target="_blank"
            rel="noreferrer"
            className="hover:text-[var(--ink)]"
          >
            {locale === "en-GB" ? "link" : "連結"}
          </a>
        ) : null}
      </div>
      <h3 className="font-serif text-[1.35rem] leading-snug text-[var(--ink)] md:text-[1.5rem]">
        {item.title}
      </h3>
      <p className="mt-3 text-[15px] leading-7 text-[var(--ink-soft)]">{item.summary}</p>
      <p className="mt-4 text-[15px] leading-7 text-[var(--ink)]">{item.macroAnalysis}</p>
    </article>
  );
}
