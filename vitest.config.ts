import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    include: ["src/**/*.test.{ts,tsx}"],
    // Pure-logic tests run in node; component tests opt into jsdom with a
    // `// @vitest-environment jsdom` docblock at the top of the file.
    environment: "node",
  },
});
