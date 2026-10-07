import { defineConfig, globalIgnores } from "eslint/config";
import nextPlugin from "@next/eslint-plugin-next";

// eslint-config-next pulls typescript-eslint, which does not yet load TS 7.0.
// Use the Next plugin flat config directly until typescript-eslint supports TS >= 7.1.
export default defineConfig([
  nextPlugin.configs["core-web-vitals"],
  {
    files: ["test/**/*.cjs"],
    rules: {
      "@next/next/no-assign-module-variable": "off",
    },
  },
  globalIgnores([
    ".next/**",
    "node_modules/**",
    ".contentlayer/**",
    "src/generated/prisma/**",
    "out/**",
  ]),
]);
