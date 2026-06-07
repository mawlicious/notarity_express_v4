import Fastify from "fastify";
import type { Config } from "./config.js";
import type { FormCache } from "./clients/form-cache.js";

export function buildServer(config: Config, formCache: FormCache) {
  const app = Fastify({ logger: true });
  const authorized = (header: string | undefined, token: string) => header === `Bearer ${token}`;

  app.get("/health", async (request, reply) => {
    if (!authorized(request.headers.authorization, config.HEALTH_TOKEN)) return reply.code(401).send({ error: "unauthorized" });
    return { ok: true, formLoaded: Boolean(formCache.form) };
  });

  return app;
}
