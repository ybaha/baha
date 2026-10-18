"use strict";

const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { join } = require("node:path");
const { it } = require("node:test");
const vm = require("node:vm");
const ts = require("@typescript/typescript6");

it("sends useful homepage context without URL secrets, even when geolocation fails", async () => {
  const source = readFileSync(join(__dirname, "../../src/app/page.client.tsx"), "utf8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  });
  for (const lookupWorks of [true, false]) {
    let deliver;
    const delivered = new Promise((resolve) => { deliver = resolve; });
    const exports = {};
    const sandbox = {
      exports, URL, Date, Intl, AbortSignal,
      window: { location: { href: "https://ybaha.com/?token=secret#private" } },
      document: {
        title: "Baha's website",
        referrer: "https://user:password@example.com/article?email=private#secret",
      },
      navigator: { userAgent: "Test UA", platform: "Test OS", language: "en", vendor: "Test vendor" },
      screen: { width: 1440, height: 900 }, innerWidth: 1200, innerHeight: 800,
      fetch: async () => {
        if (!lookupWorks) throw new Error("Blocked lookup");
        return { ok: true, json: async () => ({ ip: "192.0.2.1", org: "Example ISP", postal: "3011" }) };
      },
      require(name) {
        if (name === "react") return { useEffect: (effect) => effect() };
        if (name === "@/lib/preview") return { isVisitNotificationsEnabled: () => true };
        if (name === "@/lib/api") return { api: { visits: { notify: async (payload) => deliver(payload) } } };
        throw new Error(`Unexpected import: ${name}`);
      },
    };
    vm.runInNewContext(outputText, sandbox);
    exports.GeolocationSender();
    const payload = await delivered;
    assert.equal(payload.pageUrl, "https://ybaha.com/");
    assert.equal(payload.referrer, "https://example.com/article");
    assert.equal(payload.pageTitle, "Baha's website");
    assert.equal(payload.timezone, Intl.DateTimeFormat().resolvedOptions().timeZone);
    assert.equal(payload.organization, lookupWorks ? "Example ISP" : "");
    assert.equal(payload.postalCode, lookupWorks ? "3011" : "");
    assert.equal(payload.ip, lookupWorks ? "192.0.2.1" : "Unknown");
    assert.doesNotMatch(JSON.stringify(payload), /secret|password|private/);
  }
});
