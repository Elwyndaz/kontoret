import { defineConfig } from "vite";

// Mirror of the orgutveckling.se zone CSP (set in Cloudflare, not here), so `npm test` sees what production blocks.
const csp = "default-src 'self'; script-src 'self' 'unsafe-inline' https://static.cloudflareinsights.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self' https://cloudflareinsights.com; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'";

export default defineConfig({
  base: "/kontoret/",
  // No data: URIs: the zone CSP has font-src 'self', so Vite's inlined small font subsets were blocked.
  build: { assetsInlineLimit: 0 },
  server: {
    host: "127.0.0.1",
    port: 4173,
  },
  preview: {
    host: "127.0.0.1",
    port: 4173,
    headers: { "Content-Security-Policy": csp },
  },
});
