import { NextResponse } from "next/server";
import { readLatestDigest } from "@/lib/digest/store";
import { ingestArticles } from "@/lib/pipeline/ingest";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const latest = await readLatestDigest();
  const hasLlm = Boolean(process.env.LLM_API_KEY || process.env.OPENAI_API_KEY);
  let rssFetched = 0;
  let sourceErrors: string[] = [];
  try {
    const ingested = await ingestArticles();
    rssFetched = ingested.fetched;
    sourceErrors = ingested.sourceErrors;
  } catch {
    sourceErrors = ["ingest_failed"];
  }

  return NextResponse.json({
    ok: true,
    writerModeDefault: hasLlm ? "llm-assisted-if-available" : "heuristic",
    hasLlmKey: hasLlm,
    latestGeneratedAt: latest?.meta.generatedAt ?? null,
    latestDate: latest?.date ?? null,
    rssFetched,
    sourceErrors,
  });
}
