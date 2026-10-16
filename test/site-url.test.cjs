"use strict";

const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { join } = require("node:path");
const { describe, it } = require("node:test");

require("tsx/cjs/api").register();

function loadSiteRoutes(value) {
  const original = process.env.SITE_URL;
  try {
    if (value === undefined) delete process.env.SITE_URL;
    else process.env.SITE_URL = value;

    for (const path of ["../src/lib/site.ts", "../src/app/sitemap.ts", "../src/app/robots.ts"]) {
      delete require.cache[require.resolve(path)];
    }
    return {
      siteUrl: require("../src/lib/site.ts").siteUrl,
      sitemap: require("../src/app/sitemap.ts").default(),
      robots: require("../src/app/robots.ts").default(),
    };
  } finally {
    if (original === undefined) delete process.env.SITE_URL;
    else process.env.SITE_URL = original;
  }
}

describe("site URL", () => {
  it("defaults every sitemap URL and robots sitemap to ybaha.com", () => {
    const { siteUrl, sitemap, robots } = loadSiteRoutes(undefined);
    assert.equal(siteUrl, "https://ybaha.com");
    assert.ok(sitemap.length > 6);
    assert.ok(sitemap.every(({ url }) => new URL(url).origin === siteUrl));
    assert.ok(sitemap.some(({ url }) => url.includes("/writings/")));
    assert.ok(sitemap.some(({ url }) => url.includes("/vault/")));
    assert.equal(robots.sitemap, "https://ybaha.com/sitemap.xml");
  });

  it("uses the same normalized override for sitemap and robots", () => {
    const { siteUrl, sitemap, robots } = loadSiteRoutes(" https://preview.example.com/ ");
    assert.equal(siteUrl, "https://preview.example.com");
    assert.ok(sitemap.every(({ url }) => url.startsWith(siteUrl + "/") && !url.includes(".com//")));
    assert.equal(robots.sitemap, siteUrl + "/sitemap.xml");
  });

  it("defaults blank overrides to the production domain", () => {
    for (const value of ["", "   "]) {
      assert.equal(loadSiteRoutes(value).siteUrl, "https://ybaha.com");
    }
  });

  it("uses the shared URL for metadata and the production domain for portfolio links", () => {
    const read = (path) => readFileSync(join(__dirname, "..", path), "utf8");
    const layout = read("src/app/layout.tsx");
    assert.match(layout, /import \{ siteUrl \} from '@\/lib\/site'/);
    assert.match(layout, /metadataBase: new URL\(siteUrl\)/);
    const { EARLIER_PROJECTS } = require("../src/components/projects/data.ts");
    assert.equal(EARLIER_PROJECTS.find(({ id }) => id === "personal-website").href, "https://ybaha.com");
    assert.match(read("src/lib/constants.ts"), /url: 'https:\/\/ybaha\.com'/);
  });
});
