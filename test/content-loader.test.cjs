"use strict";

const assert = require("node:assert/strict");
const { describe, it, beforeEach } = require("node:test");
const { join } = require("node:path");

require("tsx/cjs/api").register();

const loadModule = require("../src/lib/content/load.ts");
const selectors = require("../src/lib/content/selectors.ts");

describe("content loader", () => {
  beforeEach(() => {
    loadModule.resetContentIndexForTests();
  });

  it("loads writings with basename slugs and reading time minutes", () => {
    const index = loadModule.loadContentIndex();
    assert.equal(index.writings.length, 3);
    const tsPost = index.writings.find((w) => w.slug === "typescript-is-keyword");
    assert.ok(tsPost);
    assert.equal(typeof tsPost.readingTimeMinutes, "number");
    assert.ok(tsPost.readingTimeMinutes > 0);
    assert.ok(tsPost.body.includes("`is` keyword"));
  });

  it("selectors return sorted metadata without body", () => {
    const metas = selectors.getAllWritingsMeta();
    assert.equal(metas.length, 3);
    assert.ok(!Object.prototype.hasOwnProperty.call(metas[0], "body"));
    const slug = selectors.getWritingBySlug("mcmaster-speed-secrets");
    assert.ok(slug?.body);
  });

  it("groups logs by year with basename anchor slugs", () => {
    const groups = selectors.getLogsGroupedByYear();
    assert.ok(groups.length > 0);
    const allSlugs = groups.flatMap((g) => g.items.map((i) => i.slug));
    assert.ok(allSlugs.includes("born"));
    assert.ok(allSlugs.includes("joined-teifi"));
    assert.equal(allSlugs.length, 15);
  });
});
