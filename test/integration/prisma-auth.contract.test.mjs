import assert from "node:assert/strict";
import { execSync } from "node:child_process";
import { userInfo } from "node:os";
import { rmSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { after, before, describe, it } from "node:test";

import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

import generatedPrisma from "../../src/generated/prisma/client.ts";

const { PrismaClient } = generatedPrisma;
import { assertLoopbackDatabaseUrl } from "./loopback-db.cjs";

const repoRoot = join(fileURLToPath(new URL(".", import.meta.url)), "../..");

let port;
let dataDir;
let databaseUrl;
let prisma;
let pool;

function run(cmd, stdio = "pipe") {
  execSync(cmd, { stdio, env: process.env });
}

/** pg_ctl can leave pipes open with stdio pipe, hanging execSync despite -w. */
function runPgCtl(cmd) {
  execSync(cmd, { stdio: "ignore", env: process.env });
}

before(async () => {
  port = Number(
    execSync(
      `python3 -c 'import socket;s=socket.socket();s.bind(("127.0.0.1",0));print(s.getsockname()[1]);s.close()'`
    )
      .toString()
      .trim()
  );
  dataDir = `/tmp/baha-pg-${port}`;
  process.env.PGDATA = dataDir;

  run(`initdb -D "${dataDir}" --auth=trust`);
  runPgCtl(`pg_ctl -D "${dataDir}" -o "-h 127.0.0.1 -p ${port}" -w start`);
  run(`createdb -h 127.0.0.1 -p ${port} baha_test`);

  databaseUrl = `postgresql://${userInfo().username}@127.0.0.1:${port}/baha_test`;
  assertLoopbackDatabaseUrl(databaseUrl);
  process.env.DATABASE_URL = databaseUrl;

  execSync("npx prisma db push", {
    cwd: repoRoot,
    stdio: "pipe",
    env: { ...process.env, DATABASE_URL: databaseUrl },
  });

  pool = new Pool({ connectionString: databaseUrl });
  const adapter = new PrismaPg(pool);
  prisma = new PrismaClient({ adapter });
});

after(async () => {
  await prisma?.$disconnect();
  await pool?.end();
  try {
    runPgCtl(`pg_ctl -D "${dataDir}" -m fast -w stop`);
  } catch {
    // ignore shutdown errors during cleanup
  }
  rmSync(dataDir, { recursive: true, force: true });
});

describe("Prisma 7 adapter contract on disposable PostgreSQL", () => {
  it("creates user, session, comment, and vote rows", async () => {
    const user = await prisma.user.create({
      data: {
        name: "Integration User",
        email: "integration@example.com",
      },
    });

    const session = await prisma.session.create({
      data: {
        sessionToken: "test-session-token",
        userId: user.id,
        expires: new Date(Date.now() + 60_000),
      },
    });

    const comment = await prisma.comment.create({
      data: {
        text: "hello from integration test",
        postSlug: "mcmaster-speed-secrets",
        userId: user.id,
      },
    });

    const vote = await prisma.vote.create({
      data: {
        userId: user.id,
        commentId: comment.id,
        value: 1,
      },
    });

    const loaded = await prisma.session.findUnique({
      where: { sessionToken: session.sessionToken },
      include: { user: true },
    });

    assert.equal(loaded?.user.id, user.id);
    assert.equal(vote.commentId, comment.id);
  });

  it("enforces unique vote per user and comment", async () => {
    const user = await prisma.user.create({
      data: { email: "vote-unique@example.com" },
    });
    const comment = await prisma.comment.create({
      data: {
        text: "vote target",
        postSlug: "typescript-is-keyword",
        userId: user.id,
      },
    });

    await prisma.vote.create({
      data: { userId: user.id, commentId: comment.id, value: 1 },
    });

    await assert.rejects(
      () =>
        prisma.vote.create({
          data: { userId: user.id, commentId: comment.id, value: -1 },
        }),
      (error) => error && typeof error === "object" && "code" in error
    );
  });
});
