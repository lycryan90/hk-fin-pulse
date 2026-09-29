import type { DigestItem } from "@/lib/digest/schema";

const CATEGORY_LABEL: Record<DigestItem["category"], string> = {
  finance: "finance",
  geopolitics: "geopolitics",
  government: "government",
  society: "society",
  other: "other",
};

export function NewsItem({ item }: { item: DigestItem }) {
  return (
    <article className="digest-item border-t border-[var(--line)] py-6 first:border-t-0">
      <div className="mb-2 flex flex-wrap items-baseline gap-x-3 gap-y-1 text-xs tracking-wide text-[var(--muted)]">
        <span className="font-medium text-[var(--accent)]">{item.id}</span>
        <span>{CATEGORY_LABEL[item.category]}</span>
        <span>{item.source}</span>
        {item.sourceUrl ? (
          <a
            href={item.sourceUrl}
            target="_blank"
            rel="noreferrer"
            className="underline decoration-[var(--line)] underline-offset-4 hover:text-[var(--ink)]"
          >
            原文
          </a>
        ) : null}
      </div>
      <h3 className="font-serif text-xl leading-snug text-[var(--ink)] md:text-2xl">
        〔{item.title}〕
      </h3>
      <p className="mt-3 text-[15px] leading-7 text-[var(--ink-soft)] md:text-base">
        {item.summary}
      </p>
      <div className="mt-4 border-l-2 border-[var(--accent)] pl-4">
        <p className="text-[15px] leading-7 text-[var(--ink)] md:text-base">
          {item.macroAnalysis}
        </p>
        {item.civilianLine ? (
          <p className="mt-2 text-sm text-[var(--muted)]">民生：{item.civilianLine}</p>
        ) : null}
      </div>
    </article>
  );
}
