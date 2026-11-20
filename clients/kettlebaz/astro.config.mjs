import { defineConfig } from "astro/config";

// Placeholder domain until Ryan picks one. Change `site` (and the canonical
// URL in src/pages/index.astro) once the domain is bought.
export default defineConfig({
  site: "https://www.kettlebaz.co.uk",
  build: {
    inlineStylesheets: "always",
  },
  // three.js is its own lazy chunk (~136 KB gzipped), loaded near the price section.
  vite: { build: { chunkSizeWarningLimit: 700 } },
});
