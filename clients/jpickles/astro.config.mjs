import { defineConfig } from "astro/config";

// Live domain. If it ever changes, update it here and in src/lib/site.ts, robots.txt and sitemap.xml.
export default defineConfig({
  site: "https://www.jpicklesfitnesscoaching.com",
  trailingSlash: "never",
  build: { inlineStylesheets: "always" },
  // three.js is its own lazy chunk, loaded after the hero has painted.
  vite: { build: { chunkSizeWarningLimit: 700 } },
});
