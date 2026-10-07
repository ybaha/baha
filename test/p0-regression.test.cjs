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
    ""
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
    if (id.startsWith("@/lib/comments/")) {
      const rel = id.slice("@/lib/comments/".length);
      const file = `src/lib/comments/${rel}`;
      const cached = cache.get(file);
      if (cached) return cached;
      const value = loadTranspiledModule(file, customRequire);
      cache.set(file, value);
      return value;
    }
    if (id.startsWith("@/")) {
      const file = `src/${id.slice(2)}.ts`;
      const cached = cache.get(file);
      if (cached) return cached;
      const value = loadTranspiledModule(file, customRequire);
      cache.set(file, value);
      return value;
    }
    if (id.startsWith("./") || id.startsWith("../")) {
      const absolute = join(dirname, id);
      const candidates = [".ts", ""];
      for (const ext of candidates) {
        const file = absolute + ext;
        const cached = cache.get(file);
        if (cached) return cached;
        if (existsSync(file)) {
          const value = loadTranspiledModule(
            file.replace(`${repoRoot}/`, ""),
            customRequire
          );
          cache.set(file, value);
          return value;
        }
      }
    }
    return require(id);
  };
  const wrapper = new Function(
    "exports",
    "require",
    "module",
    "__filename",
    "__dirname",
    outputText
  );
  wrapper(module.exports, req, module, sourcePath, dirname);
  return module.exports;
}
loadTranspiledModule._cache = new Map();

function loadCommentPageModule() {
  return loadTranspiledModule("src/lib/comments/commentPage.ts", {});
}

const {
  buildCommentsPageResult,
  paginateCommentRows,
  serializeComment,
  commentPageInclude,
  commentOrderBy,
} = loadCommentPageModule();

const COMMENTS_MODULE_ALIASES = {
  "@/lib/comments/commentPage": loadCommentPageModule(),
  "@/lib/comments/policy": loadTranspiledModule("src/lib/comments/policy.ts", {}),
  "@/lib/comments/validate": loadTranspiledModule(
    "src/lib/comments/validate.ts",
    {}
  ),
  "@/lib/comments/types": loadTranspiledModule("src/lib/comments/types.ts", {}),
};

function makeCommentRow(id, voterIds = []) {
  return {
    id,
    text: `comment ${id}`,
    createdAt: new Date("2024-01-01"),
    postSlug: "slug",
    userId: "author",
    updatedAt: new Date(),
    user: {
      name: "Ada",
      image: null,
    },
    votes: voterIds.map((userId, index) => ({
      value: index % 2 === 0 ? 1 : -1,
      userId,
    })),
  };
}

/** Mimics Prisma findMany with cursor + skip:1 and take limit+1. */
function fetchCommentWindow(allRows, { limit, cursor }) {
  let startIndex = 0;
  if (cursor) {
    const cursorIndex = allRows.findIndex((row) => row.id === cursor);
    assert.ok(cursorIndex >= 0, `unknown cursor ${cursor}`);
    startIndex = cursorIndex + 1;
  }
  return allRows.slice(startIndex, startIndex + limit + 1);
}

function collectPaginatedIds(allIds, limit) {
  const rows = allIds.map((id) => ({ id }));
  const seen = [];
  let cursor;
  for (let page = 0; page < 50; page += 1) {
    const window = fetchCommentWindow(rows, { limit, cursor });
    const { page: pageRows, nextCursor } = paginateCommentRows(window, limit);
    seen.push(...pageRows.map((row) => row.id));
    if (!nextCursor) {
      break;
    }
    cursor = nextCursor;
  }
  return seen;
}

describe("P0 destructive script absence", () => {
  it("build script does not run prisma db push", () => {
    const pkg = JSON.parse(readRepoFile("package.json"));
    assert.ok(!pkg.scripts.build.includes("db push"));
    assert.ok(!pkg.scripts.build.includes("accept-data-loss"));
  });

  it("install hooks only generate the Prisma client", () => {
    const pkg = JSON.parse(readRepoFile("package.json"));
    assert.equal(pkg.scripts.postinstall, "prisma generate");
    assert.ok(!existsSync(join(repoRoot, "scripts/postinstall.sh")));
  });
});

describe("comment serialization", () => {
  const baseRow = makeCommentRow("c1", ["voter-a", "voter-b", "current-user"]);
  baseRow.user = {
    name: "Ada",
    image: null,
    email: "secret@example.com",
    emailVerified: new Date(),
  };

  it("does not expose email or voter identities", () => {
    const serialized = serializeComment(baseRow, "current-user");
    const json = JSON.stringify(serialized);
    assert.ok(!json.includes("secret@example.com"));
    assert.ok(!json.includes("emailVerified"));
    assert.ok(!json.includes("voter-a"));
    assert.equal(serialized.score, 1);
    assert.equal(serialized.currentUserVote, 1);
    assert.deepEqual(serialized.user, { name: "Ada", image: null });
  });

  it("returns zero currentUserVote when logged out", () => {
    const serialized = serializeComment(baseRow, undefined);
    assert.equal(serialized.currentUserVote, 0);
  });

  it("buildCommentsPageResult matches GET/action compact shape", () => {
    const rows = [makeCommentRow("c1", ["current-user"])];
    const page = buildCommentsPageResult(rows, 10, "current-user");
    assert.equal(page.comments.length, 1);
    assert.equal(page.nextCursor, undefined);
    assert.deepEqual(Object.keys(page.comments[0]).sort(), [
      "createdAt",
      "currentUserVote",
      "id",
      "score",
      "text",
      "user",
    ]);
    assert.deepEqual(Object.keys(commentPageInclude.user.select).sort(), [
      "image",
      "name",
    ]);
  });
});

describe("comment pagination cursor", () => {
  it("returns a bounded page without mutating the fetched window", () => {
    const ids = Array.from({ length: 6 }, (_, i) => ({ id: `id-${i + 1}` }));
    const input = [...ids];
    const first = paginateCommentRows(input, 5);
    assert.deepEqual(
      first.page.map((row) => row.id),
      ["id-1", "id-2", "id-3", "id-4", "id-5"]
    );
    assert.equal(first.nextCursor, "id-5");
    assert.equal(input.length, 6);
  });

  it("traverses 12 ids with cursor+skip1 without gaps or duplicates", () => {
    const allIds = Array.from({ length: 12 }, (_, i) => `id-${i + 1}`);
    const collected = collectPaginatedIds(allIds, 5);
    assert.deepEqual(collected, allIds);
    assert.equal(new Set(collected).size, allIds.length);
  });

  it("uses deterministic newest-first ordering tie-breaker in query source", () => {
    const source = readRepoFile("src/lib/comments/commentPage.ts");
    assert.ok(source.includes('createdAt: "desc"'));
    assert.ok(source.includes('id: "desc"'));
  });
});

function makePrismaCommentRows() {
  return [
    makeCommentRow("c-newer", ["session-user", "other-voter"]),
    makeCommentRow("c-older", ["other-voter"]),
  ];
}

describe("getComments server action", () => {
  it("queries with public include, ordering, pagination, and session vote", async () => {
    const findManyCalls = [];
    const rows = makePrismaCommentRows();
    const sessionUserId = "session-user";
    const getCurrentSession = async () => ({ user: { id: sessionUserId } });
    const { getComments } = loadTranspiledModule("src/queries/getComments.ts", {
      "@/lib/auth": { authOptions: {} },
      "@/lib/auth/session": { getCurrentSession },
      "@/lib/comments/commentPage": loadCommentPageModule(),
      "@/lib/prisma": {
        prisma: {
          comment: {
            findMany: async (args) => {
              findManyCalls.push(args);
              return rows;
            },
          },
        },
      },
    });

    const page = await getComments({
      postSlug: "mcmaster-speed-secrets",
      limit: 5,
      cursor: "c-prev",
    });

    assert.equal(findManyCalls.length, 1);
    const args = findManyCalls[0];
    assert.deepEqual(args.where, { postSlug: "mcmaster-speed-secrets" });
    assert.equal(args.take, 6);
    assert.equal(args.skip, 1);
    assert.deepEqual(args.cursor, { id: "c-prev" });
    assert.deepEqual(args.orderBy, commentOrderBy);
    assert.deepEqual(args.include, commentPageInclude);
    assert.equal(page.comments.length, 2);
    assert.equal(page.comments[0].currentUserVote, 1);
    assert.equal(page.comments[1].currentUserVote, 0);
    const json = JSON.stringify(page);
    assert.ok(!json.includes("other-voter"));
    assert.ok(!json.includes("@"));
  });

  it("uses zero currentUserVote when session is absent", async () => {
    const rows = [makeCommentRow("c1", ["session-user"])];
    const { getComments } = loadTranspiledModule("src/queries/getComments.ts", {
      "@/lib/auth": { authOptions: {} },
      "@/lib/auth/session": { getCurrentSession: async () => null },
      "@/lib/comments/commentPage": loadCommentPageModule(),
      "@/lib/prisma": {
        prisma: {
          comment: {
            findMany: async () => rows,
          },
        },
      },
    });

    const page = await getComments({ postSlug: "slug", limit: 10 });
    assert.equal(page.comments[0].currentUserVote, 0);
  });
});

describe("comments GET handler", () => {
  it("returns JSON page from prisma query and session user id", async () => {
    const findManyCalls = [];
    const rows = [makeCommentRow("c1", ["u1"])];
    const { GET } = loadTranspiledModule("src/app/api/comments/route.ts", {
      ...COMMENTS_MODULE_ALIASES,
      "@/lib/auth": { authOptions: {} },
      "@/lib/auth/session": {
        getCurrentSession: async () => ({ user: { id: "u1" } }),
      },
      "@/lib/prisma": {
        prisma: {
          comment: {
            findMany: async (args) => {
              findManyCalls.push(args);
              return rows;
            },
          },
        },
      },
    });

    const response = await GET(
      new Request(
        "http://127.0.0.1/api/comments?postSlug=test-slug&limit=5&cursor=c0"
      )
    );
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(body.comments.length, 1);
    assert.equal(body.comments[0].currentUserVote, 1);
    assert.deepEqual(findManyCalls[0].include.user.select, {
      name: true,
      image: true,
    });
    assert.equal(findManyCalls[0].take, 6);
    assert.equal(findManyCalls[0].skip, 1);
  });

  it("createComment action delegates to shared validate + serialize", async () => {
    const source = readRepoFile("src/queries/createComment.ts");
    assert.ok(source.includes("validateCommentInput"));
    assert.ok(source.includes("serializeComment"));
    assert.ok(source.includes("commentPageInclude"));
    assert.ok(!source.includes("return { data: comment"));
  });

  it("createComment action rejects empty text and unknown slug", async () => {
    const { createComment } = loadTranspiledModule(
      "src/queries/createComment.ts",
      {
        ...COMMENTS_MODULE_ALIASES,
        "@/lib/auth": { authOptions: {} },
        "@/lib/auth/session": {
          getCurrentSession: async () => ({ user: { id: "u1" } }),
        },
        "@/lib/prisma": {
          prisma: {
            comment: {
              async findMany() { return []; },
              async count() { return 0; },
              async create() { throw new Error("create should not be called"); },
              async $transaction() { throw new Error("transaction should not be called"); },
            },
            $queryRaw: async () => [],
            $transaction: async () => [],
          },
        },
      }
    );
    const empty = await createComment("   ", "mcmaster-speed-secrets");
    assert.equal(empty.data, null);
    assert.match(empty.error, /empty/i);
    const badSlug = await createComment("hello", "bad slug with spaces");
    assert.equal(badSlug.data, null);
    assert.match(badSlug.error, /slug/i);
  });
});

describe("writing static params slugs", () => {
  it("maps mocked content slugs to slug arrays", async () => {
    const mockedSlugs = [["alpha-post"], ["beta-post"]];
    const { getAllWritingSlugs } = loadTranspiledModule(
      "src/queries/writings.ts",
      {
        "@/lib/content/selectors": {
          getAllWritingSlugs: () => mockedSlugs,
          getAllWritingsMeta: () => [],
          getWritingBySlug: () => undefined,
        },
        react: { cache: (fn) => fn },
      }
    );

    const slugs = await getAllWritingSlugs();
    assert.deepEqual(slugs, [["alpha-post"], ["beta-post"]]);
  });
});

describe("disabled tracking relays", () => {
  async function assert410NoFetch(relativePath) {
    const fetchCalls = [];
    const originalFetch = global.fetch;
    global.fetch = (...args) => {
      fetchCalls.push(args);
      throw new Error("unexpected outbound fetch");
    };
    try {
      const { POST } = loadTranspiledModule(relativePath, {});
      const response = await POST(
        new Request("http://127.0.0.1/api/relay", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ ping: true }),
        })
      );
      assert.equal(response.status, 410);
      assert.equal(fetchCalls.length, 0);
    } finally {
      global.fetch = originalFetch;
    }
  }

  it("status route returns 410 without outbound fetch", async () => {
    await assert410NoFetch("src/app/api/status/route.ts");
    const source = readRepoFile("src/app/api/status/route.ts");
    assert.ok(!source.includes("sendTelegramMessage"));
  });

  it("send-location route returns 410 without outbound fetch", async () => {
    await assert410NoFetch("src/app/api/send-location/route.ts");
    const source = readRepoFile("src/app/api/send-location/route.ts");
    assert.ok(!source.includes("sendTelegramMessage"));
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

describe("homepage geolocation removal", () => {
  it("does not import GeolocationSender", () => {
    const source = readRepoFile("src/app/page.tsx");
    assert.ok(!source.includes("GeolocationSender"));
    assert.ok(!source.includes("page.client"));
  });
});

describe("icon registry", () => {
  it("contains every icon name used by constants and content frontmatter", () => {
    const registry = readFileSync(join(repoRoot, "src/components/icons.tsx"), "utf8");
    const registered = new Set(
      [...registry.matchAll(/^  (\w+),$/gm)].map((m) => m[1])
    );
    const used = new Set();
    const constants = readFileSync(join(repoRoot, "src/lib/constants.ts"), "utf8");
    for (const m of constants.matchAll(/^\s*icon:\s*['"](\w+)['"]/gm)) used.add(m[1]);
    const contentRoot = join(repoRoot, "content");
    const walk = (dir) =>
      readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
        e.isDirectory() ? walk(join(dir, e.name)) : [join(dir, e.name)]
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
