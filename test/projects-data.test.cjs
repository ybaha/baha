"use strict";

const assert = require("node:assert/strict");
const { existsSync, readFileSync } = require("node:fs");
const { join } = require("node:path");
const { describe, it } = require("node:test");
const ts = require("@typescript/typescript6");

const repoRoot = join(__dirname, "..");

function loadProjectsData(file = "data.ts") {
  const sourcePath = join(repoRoot, "src/components/projects", file);
  const source = readFileSync(sourcePath, "utf8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      esModuleInterop: true,
    },
    fileName: sourcePath,
  });
  const module = { exports: {} };
  new Function("exports", "require", "module", outputText)(module.exports, require, module);
  return module.exports;
}

function loadConstantsProjects() {
  const source = readFileSync(join(repoRoot, "src/lib/constants.ts"), "utf8");
  const match = source.match(/export const PROJECTS = \[(\s[\s\S]*?)\];/);
  assert.ok(match, "PROJECTS array should exist in constants.ts");
  const names = [];
  for (const line of match[1].split("\n")) {
    const nameMatch = line.match(/name: '([^']+)'/);
    if (nameMatch) names.push(nameMatch[1]);
  }
  return names;
}

function publicAssetExists(relativePath) {
  return existsSync(join(repoRoot, "public", relativePath.replace(/^\//, "")));
}

describe("projects foundation data", () => {
  const data = loadProjectsData();

  it("preserves all 12 legacy PROJECTS names from constants.ts", () => {
    const constantsNames = loadConstantsProjects();
    const shelfNames = [...data.MOBILE_PROJECTS, ...data.EARLIER_PROJECTS].map((p) => p.name);
    assert.equal(constantsNames.length, 12);
    for (const name of constantsNames) {
      assert.ok(shelfNames.includes(name), `missing legacy project: ${name}`);
    }
  });

  it("includes Viralty and Clean ahead of legacy mobile apps", () => {
    const mobile = data.MOBILE_PROJECTS;
    assert.equal(mobile[0].name, "Viralty");
    assert.equal(mobile[1].name, "Clean");
    assert.equal(mobile.length, 9);
  });

  it("orders featured products with Karardex then Postmixr", () => {
    assert.deepEqual(
      data.FEATURED_PROJECTS.map((p) => p.id),
      ["karardex", "postmixr"]
    );
  });

  it("keeps Fullsocial archived only where original data marked abandoned", () => {
    const fullsocial = data.EARLIER_PROJECTS.find((p) => p.id === "fullsocial");
    assert.ok(fullsocial?.archived);
    const others = [...data.MOBILE_PROJECTS, ...data.EARLIER_PROJECTS].filter(
      (p) => p.id !== "fullsocial"
    );
    assert.ok(others.every((p) => !p.archived));
  });

  it("exposes valid external links for new apps", () => {
    const viralty = data.MOBILE_PROJECTS.find((p) => p.id === "viralty");
    const clean = data.MOBILE_PROJECTS.find((p) => p.id === "clean");
    assert.match(viralty.href, /6806250572/);
    assert.match(clean.href, /6802110217/);
  });

  it("keeps origin story quote and archive link", () => {
    assert.equal(data.FIRST_WEBSITE.quote, "Bakalım iyi bir site olacak mı");
    assert.match(data.FIRST_WEBSITE.archiveHref, /20110414154452/);
  });

  it("gives every collection entry a one-word description", () => {
    for (const project of [...data.MOBILE_PROJECTS, ...data.EARLIER_PROJECTS]) {
      assert.match(project.category, /^\S+$/);
    }
  });

  it("provides usable fallback links for retired domains", () => {
    const stellarzen = data.EARLIER_PROJECTS.find((p) => p.id === "stellarzen");
    const fullsocial = data.EARLIER_PROJECTS.find((p) => p.id === "fullsocial");
    assert.match(stellarzen.linkHref, /^https:\/\/web\.archive\.org\/web\/20250222121617\//);
    assert.ok(publicAssetExists(fullsocial.linkHref));
    assert.match(fullsocial.linkLabel, /offline/);
  });

  it("keeps production usage definitions and a dated snapshot", () => {
    const details = loadProjectsData("details.ts").PRODUCT_DETAILS;
    assert.deepEqual(details.postmixr.metrics.map((metric) => metric.value), [935, 1013, 12, 23]);
    assert.equal(details.postmixr.snapshot, "2026-10-12T13:58:28Z");
    assert.match(details.postmixr.metricNote, /not site traffic/);
    assert.match(details.karardex.hosting.description, /Linux laptop/);
  });

  it("references existing local mark/preview assets", () => {
    const projects = [
      ...data.FEATURED_PROJECTS,
      ...data.MOBILE_PROJECTS,
      ...data.EARLIER_PROJECTS,
    ];
    for (const project of projects) {
      assert.ok(publicAssetExists(project.markSrc), `${project.id} mark missing: ${project.markSrc}`);
      const preview = project.previewSrc ?? project.markSrc;
      assert.ok(publicAssetExists(preview), `${project.id} preview missing: ${preview}`);
    }
    if (data.FIRST_WEBSITE.previewSrc) {
      assert.ok(publicAssetExists(data.FIRST_WEBSITE.previewSrc));
    }
  });
});
