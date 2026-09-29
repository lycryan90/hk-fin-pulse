import { loadEnvFile } from "../src/lib/env";
import { isDigestLocale, type DigestLocale } from "../src/lib/locale/types";
import { generateDigest } from "../src/lib/pipeline/run";

async function main() {
  await loadEnvFile(".env");
  await loadEnvFile(".env.local");

  const forceSeed = process.argv.includes("--seed");
  const en = process.argv.includes("--en") || process.argv.includes("--en-GB");
  const zh = process.argv.includes("--zh") || process.argv.includes("--zh-HK");
  let locale: DigestLocale | undefined;
  if (en) locale = "en-GB";
  if (zh) locale = "zh-HK";
  const envLocale = process.env.DIGEST_LOCALE;
  if (!locale && isDigestLocale(envLocale)) locale = envLocale;

  const digest = await generateDigest({ forceSeed, locale });
  console.log(
    JSON.stringify(
      {
        date: digest.date,
        locale: digest.locale,
        writerMode: digest.meta.writerMode,
        themes: digest.themes.map((t) => t.label),
        ingestStats: digest.meta.ingestStats,
        path: "data/latest-digest.json",
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
