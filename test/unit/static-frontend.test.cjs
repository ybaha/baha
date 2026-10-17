"use strict";

const assert = require("node:assert/strict");
const { existsSync, readFileSync } = require("node:fs");
const { join } = require("node:path");
const { describe, it } = require("node:test");

const repoRoot = join(__dirname, "..", "..");

describe("static frontend surface", () => {
  it("does not ship Next API routes", () => {
    assert.equal(existsSync(join(repoRoot, "src/app/api")), false);
  });

  it("homepage uses the RPC visit notifier", () => {
    const source = readFileSync(join(repoRoot, "src/app/page.client.tsx"), "utf8");
    assert.ok(source.includes("api.visits.notify"));
    assert.ok(!source.includes("/api/status"));
  });

  it("build:web does not run prisma generate", () => {
    const pkg = JSON.parse(readFileSync(join(repoRoot, "package.json"), "utf8"));
    assert.ok(!pkg.scripts["build:web"].includes("prisma generate"));
    assert.ok(!pkg.scripts.postinstall);
  });

  it("next config exports a static site", () => {
    const source = readFileSync(join(repoRoot, "next.config.js"), "utf8");
    assert.ok(source.includes('output: "export"'));
  });
});
