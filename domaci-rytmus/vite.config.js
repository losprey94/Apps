import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'favicon.ico', 'apple-touch-icon-180x180.png'],
      manifest: {
        name: 'Domáci Rytmus',
        short_name: 'Dom. Rytmus',
        description: 'Rodinná appka pre domácnosť — úlohy, rastliny, nákup, rozpočet',
        theme_color: '#4f46e5',
        background_color: '#0f172a',
        display: 'standalone',
        orientation: 'portrait',
        id: 'https://losprey94.github.io/Apps/',
        scope: 'https://losprey94.github.io/Apps/',
        start_url: 'https://losprey94.github.io/Apps/',
        lang: 'sk',
        categories: ['lifestyle', 'productivity'],
        prefer_related_applications: false,
        screenshots: [
          { src: 'screenshots/mobile-1.png', sizes: '1206x2437', type: 'image/jpeg', form_factor: 'narrow', label: 'Domovská obrazovka' },
          { src: 'screenshots/mobile-2.png', sizes: '1206x2461', type: 'image/jpeg', form_factor: 'narrow', label: 'Prehľad domácnosti' },
          { src: 'screenshots/mobile-3.png', sizes: '1206x2452', type: 'image/jpeg', form_factor: 'narrow', label: 'Úlohy a plány' },
          { src: 'screenshots/mobile-4.png', sizes: '1206x2451', type: 'image/jpeg', form_factor: 'narrow', label: 'Nákupný zoznam' },
          { src: 'screenshots/mobile-5.png', sizes: '1206x2471', type: 'image/jpeg', form_factor: 'narrow', label: 'Rastliny a starostlivosť' },
        ],
        icons: [
          { src: 'pwa-64x64.png',            sizes: '64x64',    type: 'image/png' },
          { src: 'pwa-192x192.png',           sizes: '192x192',  type: 'image/png' },
          { src: 'pwa-512x512.png',           sizes: '512x512',  type: 'image/png', purpose: 'any' },
          { src: 'maskable-icon-512x512.png', sizes: '512x512',  type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\.open-meteo\.com\//,
            handler: 'NetworkFirst',
            options: { cacheName: 'weather-cache', expiration: { maxAgeSeconds: 1800 } },
          },
          {
            urlPattern: /^https:\/\/nominatim\.openstreetmap\.org\//,
            handler: 'CacheFirst',
            options: { cacheName: 'geocoding-cache', expiration: { maxAgeSeconds: 86400 } },
          },
        ],
      },
    }),
  ],
  base: './',
})
