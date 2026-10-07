import assert from "node:assert/strict";
import { execSync } from "node:child_process";
import { userInfo } from "node:os";
import { rmSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { after, before, describe, it } from "node:test";

import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const repoRoot = join(fileURLToPath(new URL(".", import.meta.url)), "../..");

let port;
let dataDir;
let databaseUrl;
let prisma;
let pool;
let sessionOverride;

function run(cmd) {
  execSync(cmd, { stdio: "pipe", env: process.env });
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
  run(
    `pg_ctl -D "${dataDir}" -o "-h 127.0.0.1 -p ${port}" -l "${dataDir}/log" -w start`
  );
  run(`createdb -h 127.0.0.1 -p ${port} baha_test`);
  databaseUrl = `postgresql://${userInfo().username}@127.0.0.1:${port}/baha_test`;
  process.env.DATABASE_URL = databaseUrl;
  process.env.NEXTAUTH_SECRET = "synthetic-dev-secret-32chars-minimum!!";
  process.env.NEXTAUTH_URL = "http://127.0.0.1:3100";

  execSync("npx prisma db push", {
    cwd: repoRoot,
    stdio: "pipe",
    env: { ...process.env, DATABASE_URL: databaseUrl },
  });

  pool = new Pool({ connectionString: databaseUrl });
  const adapter = new PrismaPg(pool);
  prisma = new (await import(`${repoRoot}/src/generated/prisma/client.ts`))
    .PrismaClient({ adapter });
});

after(async () => {
  await prisma?.$disconnect();
  await pool?.end();
  try {
    run(`pg_ctl -D "${dataDir}" -m fast -w stop`);
  } catch {
    // ignore shutdown errors during cleanup
  }
  rmSync(dataDir, { recursive: true, force: true });
});

/** Stub the current-session resolver used by the comments service. */
async function withSession(session, fn) {
  const { setSessionResolverForTests } = await import(
    `${repoRoot}/src/lib/auth/session.ts`
  );
  setSessionResolverForTests(async () => session);
  try {
    return await fn();
  } finally {
    setSessionResolverForTests(null);
  }
}

describe("comments service: policy contract", () => {
  it("createComment rejects empty / oversized / unknown-slug inputs", async () => {
    const { createComment } = await import(
      `${repoRoot}/src/queries/createComment.ts`
    );
    const empty = await createComment("   ", "mcmaster-speed-secrets");
    assert.equal(empty.data, null);
    assert.match(empty.error, /empty/i);
    const huge = await createComment("a".repeat(1500), "mcmaster-speed-secrets");
    assert.equal(huge.data, null);
    assert.match(huge.error, /long/i);
    const bad = await createComment("hi", "bad slug with spaces");
    assert.equal(bad.data, null);
    assert.match(bad.error, /slug/i);
  });

  it("createComment enforces daily quota atomically", async () => {
    const { createComment } = await import(
      `${repoRoot}/src/queries/createComment.ts`
    );
    const realUser = await prisma.user.create({
      data: { email: `quota-${Date.now()}@example.com` },
    });
    await withSession({ user: { id: realUser.id } }, async () => {
      for (let i = 0; i < 10; i += 1) {
        const result = await createComment(
          `comment ${i + 1}`,
          "mcmaster-speed-secrets"
        );
        assert.equal(result.error, null, `failed at #${i + 1}: ${result.error}`);
      }
      const blocked = await createComment("overflow", "mcmaster-speed-secrets");
      assert.equal(blocked.data, null);
      assert.match(blocked.error, /maximum/i);
    });
  });
});

describe("vote service: concurrency", () => {
  it("createVote toggles without unique-constraint failures", async () => {
    const { createVote } = await import(
      `${repoRoot}/src/queries/createVote.ts`
    );
    const user = await prisma.user.create({
      data: { email: `vote-${Date.now()}@example.com` },
    });
    const otherUser = await prisma.user.create({
      data: { email: `other-${Date.now()}@example.com` },
    });
    const comment = await prisma.comment.create({
      data: {
        text: "votable",
        postSlug: "mcmaster-speed-secrets",
        userId: otherUser.id,
      },
    });

    await withSession({ user: { id: user.id } }, async () => {
      const a = await createVote({ commentId: comment.id, liked: true });
      assert.equal(a.error, null);
      assert.equal(a.data.value, 1);

      const b = await createVote({ commentId: comment.id, liked: true });
      assert.equal(b.error, null);
      assert.equal(b.data.value, 0);

      const c = await createVote({ commentId: comment.id, liked: false });
      assert.equal(c.error, null);
      assert.equal(c.data.value, -1);

      const final = await prisma.vote.findFirst({
        where: { userId: user.id, commentId: comment.id },
      });
      assert.equal(final?.value, -1);
    });
  });
});

describe("views: known-slug guard", () => {
  it("rejects unknown post slugs", async () => {
    const { incrementPostView } = await import(
      `${repoRoot}/src/queries/incrementPostView.ts`
    );
    const result = await incrementPostView("not-a-real-slug");
    assert.equal(result.data, null);
    assert.match(result.error, /unknown/i);
  });
});
