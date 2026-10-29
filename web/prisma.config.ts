import { config } from "dotenv";
import { defineConfig, env } from "prisma/config";

// Compose injects DATABASE_URL; this also supports CLI commands in the devcontainer.
config({ path: "../.env", quiet: true });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});
