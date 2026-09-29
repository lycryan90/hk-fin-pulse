import { NextResponse } from "next/server";
import { listHistoryDates } from "@/lib/digest/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const dates = await listHistoryDates();
  return NextResponse.json({ dates });
}
