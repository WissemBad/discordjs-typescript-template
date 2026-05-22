import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  datasource: {
    url: env("DATABASE_URL"),
  },
  migrations: {
    path: "packages/database/prisma/migrations",
    seed: "bun packages/database/prisma/seed.ts",
  },
  schema: "packages/database/prisma/schema.prisma",
});
