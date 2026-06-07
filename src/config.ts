import { z } from "zod";
import { config as loadDotenv } from "dotenv";

loadDotenv({ path: ".env.local" });
loadDotenv({ path: ".env", override: false });

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(3000),
  CONVEX_URL: z.string().url(),
  OPENAI_API_KEY: z.string().default(""),
  OPENAI_ROUTINE_MODEL: z.string().default("gpt-5.4-mini"),
  OPENAI_RECOVERY_MODEL: z.string().default("gpt-5.4"),
  OPENAI_TRANSCRIBE_MODEL: z.string().default("gpt-4o-mini-transcribe"),
  OPENAI_TTS_MODEL: z.string().default("gpt-4o-mini-tts"),
  ELEVENLABS_API_KEY: z.string().default(""),
  ELEVENLABS_VOICE_ID: z.string().default("JBFqnCBsd6RMkjVDRZzb"),
  ELEVENLABS_MODEL_ID: z.string().default("eleven_flash_v2_5"),
  NOTARITY_BASE_URL: z.string().url(),
  NOTARITY_API_TOKEN: z.string().default(""),
  NOTARITY_FORM_SLUG: z.string().default("start-vienna-hackathon"),
  ADMIN_PAIRING_TOKEN: z.string().min(8),
  WHATSAPP_NUMBER: z.string().default(""),
  ENCRYPTION_KEY_BASE64: z.string().default(""),
  MEDIA_PATH: z.string().default("./media"),
  WHATSAPP_AUTH_PATH: z.string().default("auth"),
  HEALTH_TOKEN: z.string().min(8),
  FORM_REFRESH_MINUTES: z.coerce.number().positive().default(15)
});

export type Config = z.infer<typeof schema>;
export const loadConfig = (env = process.env): Config => schema.parse(env);
