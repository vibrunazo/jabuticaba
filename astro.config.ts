import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";

export default defineConfig({
  // Netlify sets URL to the site's main address (jabuticabas.netlify.app, or the
  // custom domain once one is added). Local builds fall back to the planned domain.
  site: process.env.URL ?? "https://jabuticabas.org",
  output: "static",
  i18n: {
    defaultLocale: "pt",
    locales: ["pt", "en"],
    routing: {
      prefixDefaultLocale: false,
    },
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
