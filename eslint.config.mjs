import next from "eslint-config-next/core-web-vitals"

/**
 * Mirrors the gate the backend has (`lint:check` in CI), adapted to Next.
 *
 * Note on versions: ESLint stays on 9.x because `eslint-plugin-react`, pulled in
 * by eslint-config-next, still uses the pre-10 rule context API and crashes on
 * ESLint 10. Revisit when that plugin ships an ESLint 10 build.
 */
export default [
  {
    ignores: ["node_modules/**", ".next/**", "dist/**", "coverage/**", "next-env.d.ts"],
  },

  ...next,

  {
    rules: {
      // The React Compiler rules below flag patterns that are genuinely worth
      // fixing but are not bugs on their own, and there are ~40 pre-existing
      // hits across ~20 components. Failing the build on them today would mean
      // a refactor of every effect that seeds state, with no UI tests to catch
      // the regressions. They stay visible as warnings until that pass happens
      // — deliberately, not because they are noise.
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/exhaustive-deps": "warn",

      // <img> is fine in the marketing pages, which use fixed-size assets.
      "@next/next/no-img-element": "warn",
    },
  },

  {
    // Node test/utility scripts: not Next code, and they legitimately use
    // CommonJS-flavoured identifiers.
    files: ["tests/**", "scripts/**"],
    rules: {
      "@next/next/no-assign-module-variable": "off",
    },
  },
]
