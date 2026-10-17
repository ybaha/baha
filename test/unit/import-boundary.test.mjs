import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { inspectBoundary } from "../../scripts/check-boundaries.mjs";

const check = (source, file = "src/components/example.tsx", label = "frontend") => inspectBoundary(source, file, label);

describe("client/server import boundaries", () => {
  it("allows the browser auth SDK only at its exact facade", () => {
    assert.deepEqual(check('import { createAuthClient } from "better-auth/react";', "src/lib/auth-client.ts"), []);
    assert.ok(check('import "better-auth/react";').length);
    assert.ok(check('import "better-auth/react-extra";', "src/lib/auth-client.ts").length);
    assert.ok(check('import "better-auth";', "src/lib/auth-client.ts").length);
  });

  it("checks require, dynamic imports, exports and inline import types", () => {
    for (const source of [
      'require("pg");',
      'import("drizzle-orm");',
      'export * from "next-auth";',
      'type Server = import("@baha/server").Server;',
      'import "../../server/src/auth.js";',
    ]) assert.ok(check(source).length, source);
  });

  it("keeps contracts free of frameworks, auth and Node modules", () => {
    for (const source of [
      'import "next";', 'import "hono";', 'import "node:fs";', 'import "fs";',
      'import "better-auth/react";', 'import "../../../server/src/auth.js";',
    ]) assert.ok(check(source, "packages/contracts/src/example.ts", "contracts").length, source);
    assert.deepEqual(check('import { oc } from "@orpc/contract";', "packages/contracts/src/example.ts", "contracts"), []);
  });

  it("does not confuse comments or strings with imports", () => {
    assert.deepEqual(check('// import pg from "pg";\nconst example = \'from "next-auth"\';'), []);
  });

  it("rejects Next API routes and Server Action directives", () => {
    assert.ok(check('', "src/app/api/comments/route.ts").length);
    assert.ok(check('"use server"; export async function write() {}').length);
  });
});
