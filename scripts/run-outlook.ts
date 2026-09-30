import { isDigestLocale, type DigestLocale } from "../src/lib/locale/types";
import { generateWeeklyOutlook } from "../src/lib/outlook/generate";
import { ensureRuntimeConfig } from "../src/lib/settings/ensure";

async function main() {
  await ensureRuntimeConfig();

  const en = process.argv.includes("--en") || process.argv.includes("--en-GB");
  const zh = process.argv.includes("--zh") || process.argv.includes("--zh-HK");
  const forceHeuristic = process.argv.includes("--heuristic");
  let locale: DigestLocale | undefined;
  if (en) locale = "en-GB";
  if (zh) locale = "zh-HK";
  const envLocale = process.env.DIGEST_LOCALE;
  if (!locale && isDigestLocale(envLocale)) locale = envLocale;

  const outlook = await generateWeeklyOutlook({ locale, forceHeuristic });
  console.log(
    JSON.stringify(
      {
        weekOf: outlook.weekOf,
        locale: outlook.locale,
        writerMode: outlook.meta.writerMode,
        model: outlook.meta.model,
        sectorCount: outlook.sectorRotation.length,
        sourceDigestDates: outlook.meta.sourceDigestDates,
        path: "data/latest-outlook.json",
      },
      null,
      2,
    ),
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
