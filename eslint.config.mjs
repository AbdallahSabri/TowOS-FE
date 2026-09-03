import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import noUseStateFromQuery from "./eslint-rules/no-usestate-from-query.mjs";
import noLocaleFormatOutsideTz from "./eslint-rules/no-locale-format-outside-tz.mjs";
import noAiSurface from "./eslint-rules/no-ai-surface.mjs";
import noMoneyFields from "./eslint-rules/no-money-fields.mjs";
import noRealtimeClient from "./eslint-rules/no-realtime-client.mjs";
import noOfflineApis from "./eslint-rules/no-offline-apis.mjs";
import noGeolocation from "./eslint-rules/no-geolocation.mjs";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Cut-scope guards, one rule per FE-SPEC.md §13 row (query discipline
  // and timezone discipline are CLAUDE.md invariants #1 and #4; the rest
  // are the ADR-backed cuts — AI, money, realtime, offline, driver
  // client). The other half of the offline and driver-client rows (no
  // manifest file, no driver route) is a filesystem check, not an AST
  // one — see src/lib/scope-guards.test.ts.
  {
    plugins: {
      local: {
        rules: {
          "no-usestate-from-query": noUseStateFromQuery,
          "no-locale-format-outside-tz": noLocaleFormatOutsideTz,
          "no-ai-surface": noAiSurface,
          "no-money-fields": noMoneyFields,
          "no-realtime-client": noRealtimeClient,
          "no-offline-apis": noOfflineApis,
          "no-geolocation": noGeolocation,
        },
      },
    },
    rules: {
      "local/no-usestate-from-query": "error",
      "local/no-locale-format-outside-tz": "error",
      "local/no-ai-surface": "error",
      "local/no-money-fields": "error",
      "local/no-realtime-client": "error",
      "local/no-offline-apis": "error",
      "local/no-geolocation": "error",
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
