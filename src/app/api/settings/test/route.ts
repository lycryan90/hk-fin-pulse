import { NextResponse } from "next/server";
import { readSettings } from "@/lib/settings/store";
import { testLlmConnection } from "@/lib/settings/test-llm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

type Body = {
  llmBaseUrl?: string;
  llmApiKey?: string;
  llmModel?: string;
  llmTimeoutMs?: number;
  llmProvider?: "cloud" | "local";
};

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as Body;
    const saved = await readSettings();

    let key = saved.llmApiKey;
    if (typeof body.llmApiKey === "string" && body.llmApiKey.length > 0) {
      if (!body.llmApiKey.startsWith("••••")) {
        key = body.llmApiKey;
      }
    }

    const result = await testLlmConnection({
      llmBaseUrl: body.llmBaseUrl?.trim() || saved.llmBaseUrl,
      llmApiKey: key,
      llmModel: body.llmModel?.trim() || saved.llmModel,
      llmTimeoutMs: body.llmTimeoutMs ?? saved.llmTimeoutMs,
      llmProvider: body.llmProvider || saved.llmProvider,
    });

    return NextResponse.json(result, { status: result.ok ? 200 : 422 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Test failed";
    return NextResponse.json(
      { ok: false, error: message, latencyMs: 0, baseUrl: "", model: "" },
      { status: 500 },
    );
  }
}
