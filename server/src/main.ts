import { serve } from "@hono/node-server";
import { fileURLToPath } from "node:url";

import { createAuthRuntime } from "./auth.js";
import { createApp } from "./app.js";
import { createDatabase } from "./db/client.js";
import { ConfigurationError, validateServerStartup } from "./env.js";

async function main() {
  const { serverEnv, authConfig } = validateServerStartup();

  const database = createDatabase({ connectionString: serverEnv.databaseUrl });
  const { handler, sessionResolver } = createAuthRuntime({
    db: database.db,
    config: authConfig,
  });
  const slugManifestPath = fileURLToPath(
    new URL("./slug-manifest.json", import.meta.url),
  );
  const { app } = createApp({
    env: serverEnv,
    database,
    getSession: sessionResolver,
    authHandler: handler,
    slugManifestPath,
  });

  const server = serve(
    { fetch: app.fetch, hostname: serverEnv.host, port: serverEnv.port },
    (info) => {
      console.log(`API listening on http://${info.address}:${info.port}`);
    },
  );

  const shutdown = async () => {
    server.close();
    await database.shutdown();
    process.exit(0);
  };
  process.on("SIGINT", () => void shutdown());
  process.on("SIGTERM", () => void shutdown());
}

void main().catch((error) => {
  const message = error instanceof ConfigurationError
    ? error.message : "API startup failed";
  console.error(message);
  process.exit(1);
});
