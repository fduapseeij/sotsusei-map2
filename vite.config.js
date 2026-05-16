import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  base: "/sotsusei-map2/",
  plugins: [
    react(),

    VitePWA({
      registerType: "autoUpdate",

      includeAssets: [
        "icon-192.jpg",
        "icon-512.jpg",
      ],

      workbox: {
        globPatterns: [
          "**/*.{js,css,html,png,jpg,jpeg,svg,ico,json}"
        ],

        runtimeCaching: [
          {
            urlPattern:
              /^https:\/\/.*tile.openstreetmap.org.*/,

            handler: "CacheFirst",

            options: {
              cacheName:
                "osm-tiles",

              expiration: {
                maxEntries: 5000,
                maxAgeSeconds:
                  60 * 60 * 24 * 30,
              },

              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],
      },

      manifest: {
        name: "卒制マップ",
        short_name: "卒制Map",

        description:
          "現地調査マップ",

        theme_color: "#ffffff",
        background_color:
          "#ffffff",

        display: "standalone",

        start_url: ".",
        scope: ".",

        icons: [
          {
            src: "/icon-192.jpg",
            sizes: "192x192",
            type: "image/jpeg",
          },

          {
            src: "/icon-512.jpg",
            sizes: "512x512",
            type: "image/jpeg",
          },
        ],
      },

      devOptions: {
        enabled: true,
      },
    }),
  ],
});