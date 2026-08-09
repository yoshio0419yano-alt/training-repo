import { defineConfig } from "vitest/config";

export default defineConfig({
  root: __dirname,
  css: {
    postcss: {
      plugins: [],
    },
  },
  test: {
    root: __dirname,
  },
});
