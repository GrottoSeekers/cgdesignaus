import { defineConfig } from "astro/config";

// Placeholder domain until James buys one (suggested: jpicklescoaching.co.uk).
// Change `site` here and in src/lib/site.ts once it's live.
export default defineConfig({
  site: "https://www.jpicklescoaching.co.uk",
  trailingSlash: "never",
  build: { inlineStylesheets: "always" },
  // three.js is its own lazy chunk, loaded after the hero has painted.
  vite: { build: { chunkSizeWarningLimit: 700 } },
});
