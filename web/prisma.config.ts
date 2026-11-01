import { defineConfig, env } from "prisma/config";

// Compose injects DATABASE_URL. The optional root .env also supports CLI
// commands in the devcontainer; existing variables take precedence.
try {
  process.loadEnvFile("../.env");
} catch {
  // No .env: rely on the environment alone.
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});
