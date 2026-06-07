import { loadConfig } from "./config.js";
import { ConvexHttpClient } from "convex/browser";
import { Repository } from "./db/repository.js";
import { NotarityClient } from "./clients/notarity.js";
import { FormCache } from "./clients/form-cache.js";
import { AiClient } from "./clients/openai.js";
import { ElevenLabsClient } from "./clients/elevenlabs.js";
import { MediaStore } from "./media/store.js";
import { AgentService } from "./agent/service.js";
import { WhatsAppGateway } from "./whatsapp/gateway.js";
import { buildServer } from "./server.js";
import { DEMO_PHONE_ALIASES, stevenMillerProfile } from "./agent/demo-profile.js";

const config = loadConfig();
const convex = new ConvexHttpClient(config.CONVEX_URL);
const repository = new Repository(convex, config.ENCRYPTION_KEY_BASE64);
const notarity = new NotarityClient(config.NOTARITY_BASE_URL, config.NOTARITY_API_TOKEN, config.NOTARITY_FORM_SLUG);
const formCache = new FormCache(notarity, config.FORM_REFRESH_MINUTES * 60_000);
const ai = new AiClient(
  config.OPENAI_API_KEY,
  config.OPENAI_RECOVERY_MODEL,
  config.OPENAI_TRANSCRIBE_MODEL,
  config.OPENAI_TTS_MODEL
);
const elevenlabs = new ElevenLabsClient(config.ELEVENLABS_API_KEY, config.ELEVENLABS_VOICE_ID, config.ELEVENLABS_MODEL_ID);
const media = new MediaStore(config.MEDIA_PATH);
const agent = new AgentService({
  repository,
  notarity,
  getCachedForm: () => formCache.form,
  getCachedProducts: () => formCache.products,
  transcribe: (path) => ai.transcribe(path),
  extractPdf: (path) => ai.extractPdf(path, formCache.products),
  voice: elevenlabs,
  model: config.OPENAI_ROUTINE_MODEL
});
const gateway = new WhatsAppGateway(config, agent, media);
const app = buildServer(config, formCache);

await Promise.all(DEMO_PHONE_ALIASES.map((phone) => repository.saveConvenienceProfile(phone, stevenMillerProfile)));
await formCache.start();
await gateway.start();
await app.listen({ port: config.PORT, host: "0.0.0.0" });

const shutdown = async () => {
  formCache.stop();
  await gateway.stop();
  await app.close();
  process.exit(0);
};
process.on("SIGTERM", () => void shutdown());
process.on("SIGINT", () => void shutdown());
