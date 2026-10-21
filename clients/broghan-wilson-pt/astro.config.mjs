import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://broghanwilsonpt.com", // [CONFIRM DOMAIN]
  build: {
    inlineStylesheets: "always",
  },
  // Compile the page script for older iPhones too (Safari 13+), not just the latest browsers.
  vite: {
    build: { target: ["es2019", "safari13"] },
  },
});
