import Link from "next/link";
import { WorkspaceToolbar } from "@/components/digest/workspace-toolbar";
import { listHistoryDates } from "@/lib/digest/store";

export const dynamic = "force-dynamic";

export default async function HistoryPage() {
  const dates = await listHistoryDates();

  return (
    <main>
      <WorkspaceToolbar />
      <div className="mx-auto max-w-3xl px-4 py-10 md:px-6">
        <h1 className="font-serif text-3xl text-[var(--ink)]">歷史報告</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">本地 JSON 存檔，無需帳號或付費。</p>
        <ul className="mt-8 divide-y divide-[var(--line)] border-y border-[var(--line)]">
          {dates.length === 0 ? (
            <li className="py-6 text-[var(--muted)]">尚未有歷史。請先在首頁重新生成。</li>
          ) : (
            dates.map((date) => (
              <li key={date} className="flex items-center justify-between py-4">
                <Link
                  href={`/history/${date}`}
                  className="font-serif text-xl text-[var(--ink)] hover:text-[var(--accent)]"
                >
                  {date}
                </Link>
                <a
                  href={`/api/digest/export?format=md&date=${date}`}
                  className="text-sm text-[var(--muted)] underline underline-offset-4"
                >
                  Markdown
                </a>
              </li>
            ))
          )}
        </ul>
      </div>
    </main>
  );
}
