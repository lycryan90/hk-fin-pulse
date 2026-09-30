import { loadEnvFile } from "@/lib/env";
import { loadAndApplySettings } from "@/lib/settings/store";

let loaded = false;

/** Load .env then settings.json into process.env (idempotent per process). */
export async function ensureRuntimeConfig(): Promise<void> {
  if (loaded) {
    await loadAndApplySettings();
    return;
  }
  await loadEnvFile(".env");
  await loadEnvFile(".env.local");
  await loadAndApplySettings();
  loaded = true;
}
