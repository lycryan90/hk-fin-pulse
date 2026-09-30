import { NextResponse } from "next/server";
import {
  AppSettingsSchema,
  DEFAULT_SETTINGS,
  type AppSettings,
} from "@/lib/settings/schema";
import {
  publicSettings,
  readSettings,
  writeSettings,
} from "@/lib/settings/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const settings = await readSettings();
  return NextResponse.json(publicSettings(settings));
}

export async function PUT(request: Request) {
  try {
    const body = (await request.json()) as Partial<AppSettings> & {
      llmApiKey?: string;
    };
    const current = await readSettings();
    const patch: Partial<AppSettings> = { ...body };

    let nextKey = current.llmApiKey;
    if (typeof body.llmApiKey === "string") {
      if (body.llmApiKey.startsWith("••••")) {
        nextKey = current.llmApiKey;
      } else if (body.llmApiKey.length > 0) {
        nextKey = body.llmApiKey;
      }
      // empty string → keep existing (avoid accidental wipe from blank form)
    }

    const merged = AppSettingsSchema.parse({
      ...DEFAULT_SETTINGS,
      ...current,
      ...patch,
      llmApiKey: nextKey,
    });

    const saved = await writeSettings(merged);
    return NextResponse.json(publicSettings(saved));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Save failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
