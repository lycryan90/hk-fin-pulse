import { NextResponse } from "next/server";
import { digestToMarkdown } from "@/lib/digest/export-md";
import { ensureSeedDigest } from "@/lib/pipeline/run";
import { readHistoryDigest, readLatestDigest } from "@/lib/digest/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const format = searchParams.get("format") ?? "md";
  const date = searchParams.get("date");

  let digest = date ? await readHistoryDigest(date) : await readLatestDigest();
  if (!digest && !date) digest = await ensureSeedDigest();
  if (!digest) {
    return NextResponse.json({ error: "找不到報告" }, { status: 404 });
  }

  if (format !== "md") {
    return NextResponse.json({ error: "僅支援 format=md" }, { status: 400 });
  }

  const md = digestToMarkdown(digest);
  return new NextResponse(md, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Content-Disposition": `attachment; filename="digest-${digest.date}.md"`,
    },
  });
}
