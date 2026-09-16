import { defineConfig } from "vitest/config"
import path from "node:path"

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname),
    },
  },
  test: {
    globals: true,
    environment: "node",
    // .test.ts suites run under vitest; tests/*.test.mjs run under node --test (see package.json)
    include: ["lib/**/*.test.ts", "lib/**/__tests__/**/*.test.ts"],
  },
})
