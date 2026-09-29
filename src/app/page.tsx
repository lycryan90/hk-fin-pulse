import { DigestReport } from "@/components/digest/digest-report";
import { WorkspaceToolbar } from "@/components/digest/workspace-toolbar";
import { ensureSeedDigest } from "@/lib/pipeline/run";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const digest = await ensureSeedDigest();

  return (
    <main>
      <WorkspaceToolbar date={digest.date} />
      <DigestReport digest={digest} />
    </main>
  );
}
