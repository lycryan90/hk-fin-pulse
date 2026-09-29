import { OutlookReport } from "@/components/outlook/outlook-report";
import { OutlookToolbar } from "@/components/outlook/outlook-toolbar";
import { readLatestDigest } from "@/lib/digest/store";
import { ensureWeeklyOutlook } from "@/lib/outlook/generate";

export const dynamic = "force-dynamic";

export default async function OutlookPage() {
  const digest = await readLatestDigest();
  const outlook = await ensureWeeklyOutlook(digest?.locale ?? "zh-HK");

  return (
    <main>
      <OutlookToolbar digest={digest} localeHint={outlook.locale} />
      <OutlookReport outlook={outlook} />
    </main>
  );
}
