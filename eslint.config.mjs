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
    },
  },
]);

export default eslintConfig;
