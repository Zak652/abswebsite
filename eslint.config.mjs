import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    rules: {
      // The new react-hooks rule that flags `setState` inside `useEffect`
      // catches a real anti-pattern but it also fires on perfectly valid
      // mount-time state seeding (e.g. reading a value from localStorage).
      // The right fix is to migrate those call sites to lazy `useState`
      // initialisers — tracked as a P2 cleanup. Until then, keep it as a
      // warning so we still see new violations without blocking CI.
      "react-hooks/set-state-in-effect": "warn",

      // a11y: every interactive control must carry a programmatic accessible
      // name (build guide § 3.1). The CSS-only label patterns we use across
      // CMS forms don't satisfy the rule's heuristic, so each input/select/
      // textarea/button gets an explicit `aria-label`. tr/th/td are excluded
      // because the rule misfires on table-row scaffolding.
      "jsx-a11y/control-has-associated-label": [
        "error",
        { ignoreElements: ["th", "tr", "td"] },
      ],
    },
  },
]);

export default eslintConfig;
