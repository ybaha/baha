const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");

const contractsRoot = path.join(__dirname, "..", "packages", "contracts");

async function loadContracts() {
  const distIndex = path.join(contractsRoot, "dist", "index.js");
  return import(distIndex);
}

test("@baha/contracts builds and exposes five RPC domains", async () => {
  const mod = await loadContracts();
  assert.equal(typeof mod.contract, "object");
  assert.ok(mod.contract.comments?.list);
  assert.ok(mod.contract.comments?.create);
  assert.ok(mod.contract.votes?.toggle);
  assert.ok(mod.contract.views?.get);
  assert.ok(mod.contract.views?.increment);
  assert.ok(mod.contract.visits?.notify);
});

test("comment text schema trims and enforces length", async () => {
  const { commentTextSchema } = await loadContracts();
  assert.equal(commentTextSchema.parse("  hi  "), "hi");
  assert.throws(() => commentTextSchema.parse("   "), /empty/i);
  assert.throws(() => commentTextSchema.parse("x".repeat(1001)), /too long/i);
});

test("public comment DTO uses ISO createdAt strings", async () => {
  const { publicCommentSchema } = await loadContracts();
  const sample = publicCommentSchema.parse({
    id: "c1",
    text: "hello",
    createdAt: "2026-01-01T00:00:00.000Z",
    user: { name: null, image: null },
    score: 0,
    currentUserVote: 0,
  });
  assert.equal(sample.createdAt, "2026-01-01T00:00:00.000Z");
});

test("votes.toggle output allows -1, 0, and 1", async () => {
  const { votesToggleOutputSchema } = await loadContracts();
  for (const value of [-1, 0, 1]) {
    assert.deepEqual(votesToggleOutputSchema.parse({ value }), { value });
  }
});
