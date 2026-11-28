import { defineConfig } from "astro/config";

// Placeholder domain until Curly's picks one. Change `site` here, and the
// URLs in public/robots.txt and public/sitemap.xml, once it's bought.
export default defineConfig({
  site: "https://curlys-kitchen-five.vercel.app",
  build: {
    inlineStylesheets: "always",
  },
  // three.js is its own lazy chunk, loaded after the hero has painted.
  vite: { build: { chunkSizeWarningLimit: 700 } },
});
