import { DigestReport } from "@/components/digest/digest-report";
import { WorkspaceToolbar } from "@/components/digest/workspace-toolbar";
import { diffAgainstPrevious } from "@/lib/digest/compare";
import { ensureSeedDigest } from "@/lib/pipeline/run";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const digest = await ensureSeedDigest();
  const diff = await diffAgainstPrevious(digest);

  return (
    <main>
      <WorkspaceToolbar digest={digest} />
      <DigestReport digest={digest} diff={diff} />
    </main>
  );
}
