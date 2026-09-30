import { NextResponse } from "next/server";
import { isDigestLocale } from "@/lib/locale/types";
import { generateDigest } from "@/lib/pipeline/run";
import { ensureRuntimeConfig } from "@/lib/settings/ensure";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function POST(request: Request) {
  try {
    await ensureRuntimeConfig();
    const body = (await request.json().catch(() => ({}))) as {
      forceSeed?: boolean;
      locale?: string;
    };
    const locale = isDigestLocale(body.locale) ? body.locale : undefined;
    const digest = await generateDigest({
      forceSeed: Boolean(body.forceSeed),
      locale,
    });
    return NextResponse.json(digest);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Generation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
