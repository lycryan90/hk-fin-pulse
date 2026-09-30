import { SettingsForm } from "@/components/settings/settings-form";
import { WorkspaceToolbar } from "@/components/digest/workspace-toolbar";
import { readLatestDigest } from "@/lib/digest/store";
import { readSettings, publicSettings } from "@/lib/settings/store";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const digest = await readLatestDigest();
  const settings = publicSettings(await readSettings());

  return (
    <main>
      <WorkspaceToolbar digest={digest} />
      <div className="mx-auto max-w-2xl px-5 py-12">
        <h1 className="font-serif text-3xl text-[var(--ink)]">設定</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          LLM API 同本地模型設定會存喺本機，唔會上傳到 git。
        </p>
        <SettingsForm initial={settings} />
      </div>
    </main>
  );
}
