import { notFound } from "next/navigation";
import { DigestReport } from "@/components/digest/digest-report";
import { WorkspaceToolbar } from "@/components/digest/workspace-toolbar";
import { diffAgainstPrevious } from "@/lib/digest/compare";
import { readHistoryDigest } from "@/lib/digest/store";

export const dynamic = "force-dynamic";

export default async function HistoryDatePage({
  params,
}: {
  params: Promise<{ date: string }>;
}) {
  const { date } = await params;
  const digest = await readHistoryDigest(date);
  if (!digest) notFound();
  const diff = await diffAgainstPrevious(digest);

  return (
    <main>
      <WorkspaceToolbar digest={digest} />
      <DigestReport digest={digest} diff={diff} />
    </main>
  );
}
