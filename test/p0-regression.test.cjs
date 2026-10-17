"use strict";

const assert = require("node:assert/strict");
const { readFileSync, readdirSync, existsSync } = require("node:fs");
const { join } = require("node:path");
const { describe, it } = require("node:test");
const ts = require("@typescript/typescript6");

const repoRoot = join(__dirname, "..");

function readRepoFile(relativePath) {
  return readFileSync(join(repoRoot, relativePath), "utf8");
}

function transpileRepoTs(relativePath) {
  const sourcePath = join(repoRoot, relativePath);
  const source = readFileSync(sourcePath, "utf8").replace(
    /^["']use server["'];?\s*/m,
    "",
  );
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      esModuleInterop: true,
    },
    fileName: sourcePath,
  });
  return { sourcePath, outputText };
}

function loadTranspiledModule(relativePath, customRequire) {
  const { sourcePath, outputText } = transpileRepoTs(relativePath);
  const module = { exports: {} };
  const dirname = join(sourcePath, "..");
  const cache = (loadTranspiledModule._cache ??= new Map());
  const req = (id) => {
    if (Object.prototype.hasOwnProperty.call(customRequire, id)) {
      return customRequire[id];
    }
    if (id.startsWith("@/")) {
      const file = `src/${id.slice(2)}.ts`;
      const cached = cache.get(file);
      if (cached) return cached;
      const value = loadTranspiledModule(file, customRequire);
      cache.set(file, value);
      return value;
    }
    return require(id);
  };
  const wrapper = new Function(
    "exports",
    "require",
    "module",
    "__filename",
    "__dirname",
    outputText,
  );
  wrapper(module.exports, req, module, sourcePath, dirname);
  return module.exports;
}
loadTranspiledModule._cache = new Map();

describe("P0 destructive script absence", () => {
  it("build script does not run prisma db push", () => {
    const pkg = JSON.parse(readRepoFile("package.json"));
    assert.ok(!pkg.scripts.build.includes("db push"));
    assert.ok(!pkg.scripts.build.includes("accept-data-loss"));
  });

  it("does not generate Prisma on install or web build", () => {
    const pkg = JSON.parse(readRepoFile("package.json"));
    assert.ok(!pkg.scripts.postinstall);
    assert.ok(!pkg.scripts["build:web"].includes("prisma generate"));
  });
});

describe("writing static params slugs", () => {
  it("maps mocked content slugs to slug arrays", async () => {
    const mockedSlugs = [["alpha-post"], ["beta-post"]];
    const { getAllWritingSlugs } = loadTranspiledModule("src/queries/writings.ts", {
      "@/lib/content/selectors": {
        getAllWritingSlugs: () => mockedSlugs,
        getAllWritingsMeta: () => [],
        getWritingBySlug: () => undefined,
      },
      react: { cache: (fn) => fn },
    });

    const slugs = await getAllWritingSlugs();
    assert.deepEqual(slugs, [["alpha-post"], ["beta-post"]]);
  });
});

describe("writings layout single mount", () => {
  it("renders children once", () => {
    const source = readRepoFile("src/app/writings/layout.tsx");
    const childMatches = source.match(/\{children\}/g) ?? [];
    assert.equal(childMatches.length, 1);
    assert.ok(source.includes("lg:h-screen"));
    assert.ok(source.includes("h-auto"));
  });
});

describe("vault layout minimal wrapper", () => {
  it("does not link allWritings[0] in the vault sidebar", () => {
    const source = readRepoFile("src/app/vault/layout.tsx");
    assert.ok(!source.includes("allWritings"));
    assert.ok(!source.includes("SidebarLink"));
    assert.ok(source.includes("{children}"));
  });
});

describe("homepage visit notification", () => {
  it("mounts the sender only on the homepage", () => {
    const source = readRepoFile("src/app/page.tsx");
    assert.ok(source.includes("<GeolocationSender />"));
    assert.ok(!readRepoFile("src/app/layout.tsx").includes("GeolocationSender"));
  });
});

describe("icon registry", () => {
  it("contains every icon name used by constants and content frontmatter", () => {
    const registry = readFileSync(join(repoRoot, "src/components/icons.tsx"), "utf8");
    const registered = new Set(
      [...registry.matchAll(/^  (\w+): \w+,?$/gm)].map((m) => m[1]),
    );
    const used = new Set();
    const constants = readFileSync(join(repoRoot, "src/lib/constants.ts"), "utf8");
    for (const m of constants.matchAll(/^\s*icon:\s*['"](\w+)['"]/gm)) used.add(m[1]);
    const contentRoot = join(repoRoot, "content");
    const walk = (dir) =>
      readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
        e.isDirectory() ? walk(join(dir, e.name)) : [join(dir, e.name)],
      );
    for (const file of walk(contentRoot)) {
      const text = readFileSync(file, "utf8");
      for (const m of text.matchAll(/^icon:\s*['"]?(\w+)['"]?\s*$/gm)) used.add(m[1]);
    }
    assert.ok(used.size >= 10, `expected to find used icons, got ${used.size}`);
    for (const name of used) {
      assert.ok(registered.has(name), `icon "${name}" missing from src/components/icons.tsx`);
    }
  });
});
