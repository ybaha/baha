const test = require("node:test");
const assert = require("node:assert/strict");
const { spawnSync } = require("node:child_process");
const path = require("node:path");

const script = path.join(__dirname, "..", "scripts", "check-boundaries.mjs");

function runBoundaryCheck() {
  return spawnSync(process.execPath, [script], { encoding: "utf8" });
}

test("boundary script passes on the current tree", () => {
  const result = runBoundaryCheck();
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /Boundary check passed/);
});
