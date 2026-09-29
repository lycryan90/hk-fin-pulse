import { NextResponse } from "next/server";
import { ensureWeeklyOutlook } from "@/lib/outlook/generate";
import { readLatestOutlook } from "@/lib/outlook/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  let outlook = await readLatestOutlook();
  if (!outlook) outlook = await ensureWeeklyOutlook();
  return NextResponse.json(outlook);
}
