import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      provider: undefined,
      reporter: ["text", "clover", "json"],
    },
  },
});
