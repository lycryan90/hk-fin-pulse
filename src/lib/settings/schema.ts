import { z } from "zod";

export const AppSettingsSchema = z.object({
  llmEnabled: z.boolean().default(false),
  /** cloud = remote OpenAI-compatible / Gemini; local = Ollama etc. */
  llmProvider: z.enum(["cloud", "local"]).default("cloud"),
  llmApiKey: z.string().default(""),
  llmBaseUrl: z.string().default("https://api.openai.com/v1"),
  llmModel: z.string().default("gpt-4o-mini"),
  llmTimeoutMs: z.number().int().min(15000).max(300000).default(90000),
  updatedAt: z.string().optional(),
});

export type AppSettings = z.infer<typeof AppSettingsSchema>;

export const DEFAULT_SETTINGS: AppSettings = {
  llmEnabled: false,
  llmProvider: "cloud",
  llmApiKey: "",
  llmBaseUrl: "https://api.openai.com/v1",
  llmModel: "gpt-4o-mini",
  llmTimeoutMs: 90000,
};

export const LOCAL_LLM_PRESET = {
  llmProvider: "local" as const,
  llmBaseUrl: "http://127.0.0.1:11434/v1",
  llmApiKey: "ollama",
  llmModel: "llama3.2",
};

export const GEMINI_PRESET = {
  llmProvider: "cloud" as const,
  llmBaseUrl: "https://generativelanguage.googleapis.com/v1beta/openai",
  llmModel: "gemini-3.8-flash",
};
