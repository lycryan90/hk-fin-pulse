import { loadEnvFile } from "../src/lib/env";
import { generateDigest } from "../src/lib/pipeline/run";

async function main() {
  await loadEnvFile(".env");
  await loadEnvFile(".env.local");

  const forceSeed = process.argv.includes("--seed");
  const digest = await generateDigest({ forceSeed });
  console.log(
    JSON.stringify(
      {
        date: digest.date,
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
