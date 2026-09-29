import Link from "next/link";
import { WorkspaceToolbar } from "@/components/digest/workspace-toolbar";
import { listHistoryDates, readLatestDigest } from "@/lib/digest/store";

export const dynamic = "force-dynamic";

export default async function HistoryPage() {
  const dates = await listHistoryDates();
  const latest = await readLatestDigest();
  const en = latest?.locale === "en-GB";

  return (
    <main>
      <WorkspaceToolbar digest={latest} />
      <div className="mx-auto max-w-2xl px-5 py-12">
        <h1 className="font-serif text-3xl text-[var(--ink)]">
          {en ? "Archive" : "往期"}
        </h1>
        <ul className="mt-10 divide-y divide-[var(--line)]/70 border-y border-[var(--line)]/70">
          {dates.length === 0 ? (
            <li className="py-6 text-sm text-[var(--muted)]">
              {en ? "No archives yet." : "暫無往期。"}
            </li>
          ) : (
            dates.map((d) => (
              <li key={d}>
                <Link
                  href={`/history/${d}`}
                  className="block py-4 font-serif text-xl text-[var(--ink)] hover:opacity-70"
                >
                  {d}
                </Link>
              </li>
            ))
          )}
        </ul>
      </div>
    </main>
  );
}
