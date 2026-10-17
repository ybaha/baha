#!/usr/bin/env node
import { readdir, readFile } from "node:fs/promises";
import { builtinModules } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ts from "@typescript/typescript6";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const builtins = new Set(builtinModules.flatMap((name) => [name, `node:${name}`]));
const serverPackage = /^(?:@baha\/server|pg|pg-pool|drizzle-orm|drizzle-kit|prisma|@prisma\/client|next-auth|@orpc\/server)(?:\/|$)/;

export function inspectBoundary(source, relativeFile, label = "frontend") {
  const file = ts.createSourceFile(relativeFile, source, ts.ScriptTarget.Latest, true);
  const errors = [];
  const check = (specifier) => {
    if (serverPackage.test(specifier)) errors.push(`server dependency ${specifier}`);
    if (specifier === "better-auth" || specifier.startsWith("better-auth/")) {
      if (label !== "frontend" || relativeFile !== "src/lib/auth-client.ts" || specifier !== "better-auth/react") {
        errors.push(`auth server/browser SDK outside its single client boundary: ${specifier}`);
      }
    }
    if (label === "contracts" && (/^(?:next|hono|@hono)(?:\/|$)/.test(specifier) || builtins.has(specifier))) {
      errors.push(`contracts must stay framework/Node independent: ${specifier}`);
    }
    if (specifier.startsWith(".")) {
      const target = path.relative(root, path.resolve(root, path.dirname(relativeFile), specifier));
      if (target.startsWith(`server${path.sep}`) || target.startsWith(`test${path.sep}generated${path.sep}`)) {
        errors.push(`relative server/test dependency ${specifier}`);
      }
    }
  };
  const visit = (node) => {
    if ((ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) && node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) {
      check(node.moduleSpecifier.text);
    }
    if (ts.isImportTypeNode(node) && ts.isLiteralTypeNode(node.argument) && ts.isStringLiteral(node.argument.literal)) {
      check(node.argument.literal.text);
    }
    if (ts.isCallExpression(node) && node.arguments[0] && ts.isStringLiteral(node.arguments[0]) && (
      node.expression.kind === ts.SyntaxKind.ImportKeyword ||
      (ts.isIdentifier(node.expression) && node.expression.text === "require")
    )) check(node.arguments[0].text);
    if (ts.isExpressionStatement(node) && ts.isStringLiteral(node.expression) && node.expression.text === "use server") {
      errors.push("Server Actions are not allowed");
    }
    ts.forEachChild(node, visit);
  };
  visit(file);
  if (relativeFile.startsWith("src/app/api/")) errors.push("Next API routes are not allowed");
  return errors;
}

async function walk(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== "generated") files.push(...await walk(full));
    } else if (/\.[cm]?[jt]sx?$/.test(entry.name)) files.push(full);
  }
  return files;
}

async function main() {
  const violations = [];
  for (const [directory, label] of [["src", "frontend"], ["packages/contracts/src", "contracts"]]) {
    for (const file of await walk(path.join(root, directory))) {
      const relative = path.relative(root, file).replaceAll(path.sep, "/");
      for (const error of inspectBoundary(await readFile(file, "utf8"), relative, label)) {
        violations.push(`${relative}: ${error}`);
      }
    }
  }
  if (violations.length) {
    console.error("Boundary check failed:\n" + violations.join("\n"));
    process.exitCode = 1;
  } else console.log("Boundary check passed.");
}
if (path.resolve(process.argv[1] ?? "") === fileURLToPath(import.meta.url)) await main();
