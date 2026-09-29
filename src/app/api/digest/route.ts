import { NextResponse } from "next/server";
import { ensureSeedDigest } from "@/lib/pipeline/run";
import { readLatestDigest } from "@/lib/digest/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  let digest = await readLatestDigest();
  if (!digest) digest = await ensureSeedDigest();
  return NextResponse.json(digest);
}
