import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      // TODO: fix in vitest
      provider: undefined,
      reporter: ["text", "clover", "json"]
    }
  }
});
