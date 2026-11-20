import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://cgdesignaus.com",
  // Every page lives at a folder-style address ending in "/" (e.g. /work/), which is what
  // GitHub Pages serves, the canonical tags say and the sitemap lists. Links use the same form.
  trailingSlash: "always",
  build: {
    inlineStylesheets: "always",
  },
});
