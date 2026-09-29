import { NextResponse } from "next/server";
import { readHistoryDigest } from "@/lib/digest/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: { params: Promise<{ date: string }> },
) {
  const { date } = await context.params;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "日期格式無效" }, { status: 400 });
  }
  const digest = await readHistoryDigest(date);
  if (!digest) {
    return NextResponse.json({ error: "找不到該日報告" }, { status: 404 });
  }
  return NextResponse.json(digest);
}
