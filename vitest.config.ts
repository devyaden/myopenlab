import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

// Unit tests for the agent's pure modules (converters, patch ops, node-id
// reconcile) and golden loop behavior. Node environment — none of these touch the
// DOM. The `@/` alias is resolved from tsconfig via vite-tsconfig-paths.
export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: "node",
    include: ["lib/**/__tests__/**/*.test.ts"],
  },
});
