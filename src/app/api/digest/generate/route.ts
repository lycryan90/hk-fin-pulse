import { NextResponse } from "next/server";
import { generateDigest } from "@/lib/pipeline/run";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as {
      forceSeed?: boolean;
    };
    const digest = await generateDigest({ forceSeed: Boolean(body.forceSeed) });
    return NextResponse.json(digest);
  } catch (error) {
    const message = error instanceof Error ? error.message : "生成失敗";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
