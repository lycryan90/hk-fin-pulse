import { NextResponse } from "next/server";
import { isDigestLocale } from "@/lib/locale/types";
import { generateWeeklyOutlook } from "@/lib/outlook/generate";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as {
      locale?: string;
      weekOf?: string;
      forceHeuristic?: boolean;
    };
    const locale = isDigestLocale(body.locale) ? body.locale : undefined;
    const outlook = await generateWeeklyOutlook({
      locale,
      weekOf: body.weekOf,
      forceHeuristic: Boolean(body.forceHeuristic),
    });
    return NextResponse.json(outlook);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Generation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
