import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import noUseStateFromQuery from "./eslint-rules/no-usestate-from-query.mjs";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Query discipline (FE-SPEC.md §13, CLAUDE.md invariant #1): no
  // useState initialized from a TanStack Query result.
  {
    plugins: {
      local: { rules: { "no-usestate-from-query": noUseStateFromQuery } },
    },
    rules: {
      "local/no-usestate-from-query": "error",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
