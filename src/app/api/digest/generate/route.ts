import { NextResponse } from "next/server";
import { isDigestLocale } from "@/lib/locale/types";
import { generateDigest } from "@/lib/pipeline/run";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(request: Request) {
  try {
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
