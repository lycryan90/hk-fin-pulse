import { NextResponse } from "next/server";
import { diffAgainstPrevious } from "@/lib/digest/compare";
import { ensureSeedDigest } from "@/lib/pipeline/run";
import { readHistoryDigest, readLatestDigest } from "@/lib/digest/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date");
  let digest = date ? await readHistoryDigest(date) : await readLatestDigest();
  if (!digest && !date) digest = await ensureSeedDigest();
  if (!digest) {
    return NextResponse.json({ error: "找不到報告" }, { status: 404 });
  }
  const diff = await diffAgainstPrevious(digest);
  return NextResponse.json({ date: digest.date, diff });
}
