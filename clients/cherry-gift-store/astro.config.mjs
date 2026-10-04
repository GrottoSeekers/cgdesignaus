import { defineConfig } from "astro/config";

// Change this when the domain is bought — it feeds canonical URLs, the sitemap and social previews.
export default defineConfig({
  site: "https://www.cherrygiftstore.co.ke",
  build: {
    inlineStylesheets: "always",
  },
});
