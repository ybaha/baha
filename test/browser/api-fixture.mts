import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
import { readFile, writeFile } from "node:fs/promises";

const [root, frontendPort, apiPort, metadataFile] = process.argv.slice(2);
const require = createRequire(`${root}/package.json`);
const load = (relative: string) => import(pathToFileURL(`${root}/${relative}`).href);
const { startLoopbackPostgres } = await load("test/integration/server-pg.mjs");
const { createDatabase } = await load("server/src/db/client.ts");
const { runMigrations } = await load("server/src/db/migrate.ts");
const { createAuthRuntime } = await load("server/src/auth.ts");
const { createApp } = await load("server/src/app.ts");
const { parseServerEnv, parseAuthConfig } = await load("server/src/env.ts");
const { getCookies } = await import(pathToFileURL(require.resolve("better-auth/cookies")).href);
const { serializeSignedCookie } = await import(pathToFileURL(require.resolve("better-call")).href);
const { serve } = await import(pathToFileURL(require.resolve("@hono/node-server")).href);

let fixture: Awaited<ReturnType<typeof startLoopbackPostgres>> | undefined;
let database: ReturnType<typeof createDatabase> | undefined;
let server: ReturnType<typeof serve> | undefined;
let closing = false;
async function close() {
  if (closing) return;
  closing = true;
  if (server) {
    await new Promise<void>((done) => {
      server!.close(() => done());
      server!.closeAllConnections();
    });
  }
  await database?.shutdown();
  await fixture?.stop();
}
for (const signal of ["SIGTERM", "SIGINT"] as const) {
  process.once(signal, () => void close().then(() => process.exit(0), () => process.exit(1)));
}
try {
  fixture = await startLoopbackPostgres();
  database = createDatabase({ connectionString: fixture.databaseUrl });
  await runMigrations(database.db, fixture.databaseUrl);
  const frontendOrigin = `http://127.0.0.1:${frontendPort}`;
  const apiOrigin = `http://127.0.0.1:${apiPort}`;
  const env = parseServerEnv({
    NODE_ENV: "test", DATABASE_URL: fixture.databaseUrl,
    API_READ_ORIGINS: frontendOrigin,
    API_WRITE_ORIGINS: frontendOrigin,
    API_PREVIEW_READ_ORIGINS: "https://migration-preview.pages.dev",
  });
  const config = parseAuthConfig({
    API_AUTH_SECRET: "synthetic-browser-only-auth-secret-32chars!!",
    API_BASE_URL: apiOrigin,
    GITHUB_CLIENT_ID: "browser-test-github", GITHUB_CLIENT_SECRET: "synthetic",
    GOOGLE_CLIENT_ID: "browser-test-google", GOOGLE_CLIENT_SECRET: "synthetic",
  }, env);
  const runtime = createAuthRuntime({ db: database.db, config });
  const slug = "mcmaster-speed-secrets";
  await database.pool.query(`INSERT INTO "User" (id,name,email) VALUES
    ('browser-alice','Browser Alice','browser-alice@example.invalid'),
    ('browser-author','Existing Reader','browser-author@example.invalid')`);
  for (let i = 1; i <= 12; i += 1) {
    await database.pool.query(`INSERT INTO "Comment" (id,text,"postSlug","userId","createdAt","updatedAt")
      VALUES ($1,$2,$3,'browser-author',$4,$4)`,
      [`browser-comment-${String(i).padStart(2,"0")}`, `Seed comment ${i}`, slug, new Date(Date.now() - i * 60_000).toISOString()]);
  }
  const manifest = JSON.parse(await readFile(`${root}/server/src/slug-manifest.json`, "utf8"));
  for (const post of manifest.writingSlugs) {
    await database.pool.query(`INSERT INTO "PostView" (id,slug,count,"createdAt","updatedAt") VALUES ($1,$2,123,NOW(),NOW())`, [`browser-view-${post}`,post]);
  }
  const token = "synthetic-browser-session-token";
  await database.pool.query(`INSERT INTO auth_session (id,token,"userId","expiresAt") VALUES
    ('browser-session',$1,'browser-alice',$2)`, [token,new Date(Date.now() + 3_600_000).toISOString()]);
  const definition = getCookies(runtime.auth.options).sessionToken;
  const setCookie = await serializeSignedCookie(definition.name,token,config.secret,definition.attributes);
  const pair = setCookie.split(";",1)[0];
  const value = pair.slice(pair.indexOf("=") + 1);
  const { app } = createApp({
    env, database, getSession: runtime.sessionResolver, authHandler: runtime.handler,
    slugManifestPath: `${root}/server/src/slug-manifest.json`,
  });
  await new Promise<void>((done) => {
    server = serve({ fetch: app.fetch, hostname: "127.0.0.1", port: Number(apiPort) }, () => done());
  });
  await writeFile(metadataFile,JSON.stringify({
    apiOrigin,frontendOrigin,slug,
    cookie: { name: definition.name, value, domain: "127.0.0.1", path: "/", httpOnly: true, secure: false, sameSite: "Lax" },
  }));
  console.log("READY: owned local browser API and disposable database");
} catch (error) {
  console.error(error);
  await close();
  process.exit(1);
}
