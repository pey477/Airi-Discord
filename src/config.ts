import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  DISCORD_TOKEN: z.string().min(1),
  DISCORD_CLIENT_ID: z.string().min(1),
  DISCORD_GUILD_ID: z.string().optional().default(""),
  GROQ_API_KEY: z.string().optional().default(""),
  GROQ_CHAT_MODEL: z.string().default("openai/gpt-oss-20b"),
  // Optional: only needed for the current paid OpenAI-based voice pipeline.
  OPENAI_API_KEY: z.string().optional().default(""),
  OPENAI_TRANSCRIPTION_MODEL: z.string().default("gpt-4o-mini-transcribe"),
  OPENAI_TTS_MODEL: z.string().default("gpt-4o-mini-tts"),
  OPENAI_TTS_VOICE: z.enum(["alloy", "ash", "ballad", "coral", "echo", "fable", "onyx", "nova", "sage", "shimmer", "verse"]).default("nova"),
  VOICE_MAX_SECONDS: z.coerce.number().int().min(5).max(30).default(18),
  VOICE_SILENCE_MS: z.coerce.number().int().min(500).max(3000).default(1100),
  // Treat an empty Railway variable as unset; z.string().url() rejects "".
  SUPABASE_URL: z.preprocess(
    (value) => value === "" ? undefined : value,
    z.string().url().optional()
  ).transform((value) => value ?? ""),
  SUPABASE_SECRET_KEY: z.string().optional().default("")
}).superRefine((value, context) => {
  const hasUrl = value.SUPABASE_URL.length > 0;
  const hasKey = value.SUPABASE_SECRET_KEY.length > 0;
  if (hasUrl !== hasKey) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: "SUPABASE_URL and SUPABASE_SECRET_KEY must both be set or both be empty.",
      path: [hasUrl ? "SUPABASE_SECRET_KEY" : "SUPABASE_URL"]
    });
  }
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  console.error("Invalid environment configuration:");
  console.error(parsed.error.flatten().fieldErrors);
  throw new Error("Please check your .env file against .env.example");
}

export const config = parsed.data;
