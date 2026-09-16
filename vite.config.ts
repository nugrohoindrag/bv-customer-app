import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";
import path from "node:path";

// BVRooms Customer App = PWA (pola sama Tenant PWA) + dibungkus Capacitor untuk Android/iOS.
// Dev: proxy /api → backend Go. Native: VITE_API_BASE absolut (lihat .env.example).
const apiTarget = process.env.BV_API_URL || "http://localhost:8080";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "prompt",
      includeAssets: ["icons/*.svg", "icons/*.png"],
      manifest: {
        id: "/",
        name: "BVRooms",
        short_name: "BVRooms",
        description: "Pesan kamar hotel & unit apartemen dengan mudah, aman, dan nyaman.",
        lang: "id",
        dir: "ltr",
        start_url: "/",
        scope: "/",
        display: "standalone",
        orientation: "portrait",
        background_color: "#FFFFFF",
        theme_color: "#2ECC71",
        categories: ["travel", "lifestyle"],
        icons: [
          { src: "icons/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "icons/icon-512.png", sizes: "512x512", type: "image/png" },
          { src: "icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
          { src: "icons/icon.svg", sizes: "any", type: "image/svg+xml" },
        ],
        shortcuts: [
          { name: "Booking Saya", short_name: "Booking", url: "/bookings", icons: [{ src: "icons/icon-192.png", sizes: "192x192" }] },
          { name: "Tersimpan", short_name: "Saved", url: "/saved", icons: [{ src: "icons/icon-192.png", sizes: "192x192" }] },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,png,woff2}"],
        globIgnores: ["**/push-sw.js"],
        importScripts: ["push-sw.js"],
        navigateFallback: "/index.html",
        navigateFallbackDenylist: [/^\/api\//, /^\/public\//],
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          {
            // katalog publik & data customer: NetworkFirst agar offline masih menampilkan data terakhir (Figma: "Yah, gada ada internet")
            urlPattern: ({ url, request }) => request.method === "GET" && url.pathname.startsWith("/api/v1/bvrooms/"),
            handler: "NetworkFirst",
            options: { cacheName: "bvrooms-api", networkTimeoutSeconds: 6, expiration: { maxEntries: 150, maxAgeSeconds: 60 * 60 * 24 } },
          },
          {
            urlPattern: ({ request }) => request.destination === "image",
            handler: "StaleWhileRevalidate",
            options: { cacheName: "bvrooms-img", expiration: { maxEntries: 300, maxAgeSeconds: 60 * 60 * 24 * 14 } },
          },
          {
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
            handler: "CacheFirst",
            options: { cacheName: "bvrooms-fonts", expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 } },
          },
        ],
      },
      devOptions: { enabled: false },
    }),
  ],
  define: { __APP_VERSION__: JSON.stringify(process.env.npm_package_version || "0.1.0") },
  resolve: { alias: { "@": path.resolve(import.meta.dirname, "src") } },
  server: {
    port: 5176,
    proxy: {
      "/api": { target: apiTarget, changeOrigin: true },
      "/public": { target: apiTarget, changeOrigin: true },
    },
  },
  preview: {
    port: 4176,
    allowedHosts: [".trycloudflare.com"],
    proxy: {
      "/api": { target: apiTarget, changeOrigin: true },
      "/public": { target: apiTarget, changeOrigin: true },
    },
  },
  build: {
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (id.includes("node_modules/react") || id.includes("node_modules/react-dom") || id.includes("node_modules/react-router") || id.includes("node_modules/@tanstack/react-query")) return "vendor";
          return undefined;
        },
      },
    },
  },
  test: { environment: "jsdom", globals: true, setupFiles: ["./src/test/setup.ts"] },
});
