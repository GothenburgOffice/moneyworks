import { defineConfig, env } from "prisma/config";

// Compose builds DATABASE_URL from POSTGRES_PASSWORD and injects it.
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});
