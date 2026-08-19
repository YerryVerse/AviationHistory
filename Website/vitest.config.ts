import { configDefaults, defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname),
    },
  },
  test: {
    environment: "node",
    exclude: [...configDefaults.exclude, "scripts/verify-static-export.test.mjs"],
    setupFiles: ["./vitest.setup.ts"],
  },
});
