import { defineConfig } from "astro/config";

// Set to the real domain before launch (canonical URL + social previews).
export default defineConfig({
  site: "https://www.inserthere.com",
  build: { inlineStylesheets: "always" },
});
