import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://broghanwilson.com",
  build: {
    inlineStylesheets: "always",
  },
  // Compile the page script for older iPhones too (Safari 13+), not just the latest browsers.
  vite: {
    build: { target: ["es2019", "safari13"] },
  },
});
