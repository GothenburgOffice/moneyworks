import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    files: ["src/components/**/*.{ts,tsx}", "src/content/**/*.{ts,tsx}", "src/features/**/*.{ts,tsx}", "src/i18n/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": ["error", {
        patterns: [{
          group: ["@/lib/db", "@/lib/auth", "@/lib/auth-*", "**/lib/db", "**/lib/auth", "**/lib/auth-*", "@/generated/**", "**/generated/**"],
          message: "Presentation, content and pure features must not import server persistence or auth. Resolve server data in the route and pass minimal props.",
        }],
      }],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "src/generated/prisma/**",
    "public/fire-calculator.js",
  ]),
]);

export default eslintConfig;
