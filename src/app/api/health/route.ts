import { NextResponse } from "next/server";
import { readLatestDigest } from "@/lib/digest/store";
import { ingestArticles } from "@/lib/pipeline/ingest";
import { llmConfigured, llmEndpoint } from "@/lib/writer/llm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const latest = await readLatestDigest();
  const hasLlm = llmConfigured();
  let rssFetched = 0;
  let sourceErrors: string[] = [];
  try {
    const ingested = await ingestArticles();
    rssFetched = ingested.fetched;
    sourceErrors = ingested.sourceErrors;
  } catch {
    sourceErrors = ["ingest_failed"];
  }

  const endpoint = hasLlm ? llmEndpoint() : null;

  return NextResponse.json({
    ok: true,
    writerModeDefault: hasLlm ? "llm-assisted-if-available" : "heuristic",
    hasLlmKey: hasLlm,
    llm: hasLlm
      ? { base: endpoint!.base, model: endpoint!.model }
      : { base: null, model: null },
    latestGeneratedAt: latest?.meta.generatedAt ?? null,
    latestDate: latest?.date ?? null,
    rssFetched,
    sourceErrors,
  });
}
