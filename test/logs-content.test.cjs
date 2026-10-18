"use strict";

const assert = require("node:assert/strict");
const { existsSync } = require("node:fs");
const { join } = require("node:path");
const { describe, it } = require("node:test");

require("tsx/cjs/api").register();

const { getAllLogs, getLogsGroupedByYear } = require("../src/lib/content/selectors.ts");
const { FEATURED_PROJECTS, MOBILE_PROJECTS } = require("../src/components/projects/data.ts");

function destination(href) {
  const appId = href.match(/apps\.apple\.com\/.*\b(id\d+)/)?.[1];
  return appId ?? href.replace(/\/$/, "");
}

function links(log) {
  return [...log.body.matchAll(/href=["']([^"']+)["']/g)].map((match) => match[1]);
}

describe("log content", () => {
  const logs = getAllLogs();
  const bySlug = new Map(logs.map((log) => [log.slug, log]));

  it("covers every featured product and mobile app with its correct destination", () => {
    const destinations = new Set(logs.flatMap(links).map(destination));
    for (const project of [...FEATURED_PROJECTS, ...MOBILE_PROJECTS]) {
      assert.ok(destinations.has(destination(project.href)), `missing log link for ${project.id}`);
    }
  });

  it("uses verified App Store release dates rather than development dates", () => {
    const releases = {
      "created-picu": ["PicU", "2025-07-02", "id6745964976"],
      "released-math-help-ai": ["Math Help AI", "2025-08-12", "id6740034105"],
      "released-vidgen3": ["VidGen3", "2025-08-12", "id6749280633"],
      "released-glb": ["GLB", "2026-01-14", "id6749620007"],
      "released-grip": ["Grip", "2026-02-16", "id6755091590"],
      "released-rooma": ["Rooma", "2026-02-20", "id6758413701"],
      "released-clean": ["Clean", "2026-08-25", "id6802110217"],
      "released-viralty": ["Viralty", "2026-09-02", "id6806250572"],
    };
    for (const [slug, [name, date, appId]] of Object.entries(releases)) {
      const log = bySlug.get(slug);
      assert.ok(log, `missing release: ${slug}`);
      assert.equal(log.title, `Released ${name}`);
      assert.equal(log.date, date);
      assert.ok(links(log).some((href) => destination(href) === appId));
    }
  });

  it("includes recent tools without linking private repositories or home services", () => {
    for (const slug of ["built-bin", "building-botbox", "building-valise", "updated-logar", "built-tv-dashboard", "developer-workflow", "updated-personal-site"]) {
      assert.ok(bySlug.has(slug), `missing update: ${slug}`);
    }
    assert.ok(links(bySlug.get("built-bin")).includes("https://bin.ybaha.com"));
    for (const slug of ["building-botbox", "building-valise", "updated-logar", "built-tv-dashboard"]) {
      assert.deepEqual(links(bySlug.get(slug)), []);
    }
  });

  it("keeps corrected historical links and stable anchors", () => {
    assert.ok(links(bySlug.get("university")).includes("https://www.atilim.edu.tr/en"));
    assert.ok(!bySlug.get("university").body.includes("metu.edu.tr"));
    assert.ok(links(bySlug.get("stellarzen")).some((href) => href.startsWith("https://web.archive.org/")));
    assert.ok(links(bySlug.get("launched-botguise")).includes("https://botguise.com"));
    assert.ok(!bySlug.get("launched-botguise").body.includes("__blank"));
    assert.ok(bySlug.has("created-picu"));
    assert.ok(bySlug.has("created-pico-cards"));
  });

  it("orders years and entries newest-first and resolves internal destinations", () => {
    const groups = getLogsGroupedByYear();
    for (let i = 1; i < groups.length; i++) {
      assert.ok(groups[i - 1].year > groups[i].year);
    }
    for (const group of groups) {
      for (let i = 1; i < group.items.length; i++) {
        assert.ok(Date.parse(group.items[i - 1].date) >= Date.parse(group.items[i].date));
      }
    }
    for (const log of logs) {
      assert.ok(Number.isFinite(Date.parse(log.date)), `invalid date: ${log.slug}`);
      for (const href of links(log).filter((href) => href.startsWith("/"))) {
        assert.ok(existsSync(join(__dirname, "../src/app", href, "page.tsx")), `missing route: ${href}`);
      }
    }
  });
});
