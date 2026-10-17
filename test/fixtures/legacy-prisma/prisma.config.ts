import { defineConfig } from "prisma/config";

/** Fixture-only config: never connects; URL satisfies Prisma 7 config validation. */
export default defineConfig({
  schema: "schema.prisma",
  datasource: {
    url: "postgresql://legacy-test:legacy-test@127.0.0.1:1/legacy_test_fixture",
  },
});
