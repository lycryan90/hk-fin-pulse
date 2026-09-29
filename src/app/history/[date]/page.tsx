import { notFound } from "next/navigation";
import { DigestReport } from "@/components/digest/digest-report";
import { WorkspaceToolbar } from "@/components/digest/workspace-toolbar";
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

  return (
    <main>
      <WorkspaceToolbar date={digest.date} />
      <DigestReport digest={digest} />
    </main>
  );
}
