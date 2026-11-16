import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Read version from package.json at build time
const package_ = JSON.parse(readFileSync(path.resolve(__dirname, 'package.json'), 'utf8'));
const APP_VERSION = package_.version;

// Disable PWA for test builds to avoid Windows workbox-build dynamic require issue
const isTestBuild = process.env.VITE_TEST_BUILD === 'true';

const plugins = [
  react(),
  ...(isTestBuild
    ? []
    : [
        VitePWA({
          registerType: 'autoUpdate',
          includeAssets: ['favicon.ico', 'robots.txt', 'apple-touch-icon.png'],
          manifest: {
            name: 'MetalPro Devis',
            short_name: 'MetalPro',
            description: 'Application de devis pour métallerie - Conforme TVA Cameroun',
            theme_color: '#2563eb',
            background_color: '#ffffff',
            display: 'standalone',
            orientation: 'portrait-primary',
            scope: '/',
            start_url: '/',
            lang: 'fr',
            categories: ['business', 'finance', 'productivity'],
            icons: [
              {
                src: '/icons/icon-72x72.png',
                sizes: '72x72',
                type: 'image/png',
                purpose: 'maskable any',
              },
              {
                src: '/icons/icon-96x96.png',
                sizes: '96x96',
                type: 'image/png',
                purpose: 'maskable any',
              },
              {
                src: '/icons/icon-128x128.png',
                sizes: '128x128',
                type: 'image/png',
                purpose: 'maskable any',
              },
              {
                src: '/icons/icon-144x144.png',
                sizes: '144x144',
                type: 'image/png',
                purpose: 'maskable any',
              },
              {
                src: '/icons/icon-152x152.png',
                sizes: '152x152',
                type: 'image/png',
                purpose: 'maskable any',
              },
              {
                src: '/icons/icon-192x192.png',
                sizes: '192x192',
                type: 'image/png',
                purpose: 'maskable any',
              },
              {
                src: '/icons/icon-384x384.png',
                sizes: '384x384',
                type: 'image/png',
                purpose: 'maskable any',
              },
              {
                src: '/icons/icon-512x512.png',
                sizes: '512x512',
                type: 'image/png',
                purpose: 'maskable any',
              },
            ],
            screenshots: [],
            shortcuts: [
              {
                name: 'Nouveau devis',
                short_name: 'Devis',
                description: 'Créer un nouveau devis',
                url: '/devis/nouveau',
                icons: [{ src: '/icons/icon-192x192.png', sizes: '192x192' }],
              },
              {
                name: 'Clients',
                short_name: 'Clients',
                description: 'Gérer les clients',
                url: '/clients',
                icons: [{ src: '/icons/icon-192x192.png', sizes: '192x192' }],
              },
            ],
          },
          workbox: {
            globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
            runtimeCaching: [
              {
                urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
                handler: 'CacheFirst',
                options: {
                  cacheName: 'google-fonts-cache',
                  expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
                  cacheableResponse: { statuses: [0, 200] },
                },
              },
              {
                urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
                handler: 'CacheFirst',
                options: {
                  cacheName: 'gstatic-fonts-cache',
                  expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
                  cacheableResponse: { statuses: [0, 200] },
                },
              },
            ],
            skipWaiting: true,
            clientsClaim: true,
            cleanupOutdatedCaches: true,
            maximumFileSizeToCacheInBytes: 2 * 1024 * 1024,
          },
          devOptions: { enabled: true, type: 'module' },
        }),
      ]),
];

export default defineConfig({
  base: '/',
  define: {
    __APP_VERSION__: JSON.stringify(APP_VERSION),
  },
  plugins,
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'dexie',
      'zustand',
      'decimal.js',
      'zod',
      'clsx',
      'tailwind-merge',
      'lucide-react',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-select',
      '@radix-ui/react-tabs',
      '@radix-ui/react-toast',
      '@radix-ui/react-label',
      '@radix-ui/react-slot',
      '@hookform/resolvers',
      'react-hook-form',
      'date-fns',
      'nanoid',
      '@react-pdf/renderer',
    ],
    force: true,
  },
  build: {
    target: 'ES2022',
    minify: 'terser',
    cssCodeSplit: true,
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          ui: [
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-select',
            '@radix-ui/react-tabs',
            '@radix-ui/react-toast',
            '@radix-ui/react-label',
            '@radix-ui/react-slot',
          ],
          pdf: ['@react-pdf/renderer'],
          db: ['dexie'],
          utils: [
            'zustand',
            'react-hook-form',
            'zod',
            '@hookform/resolvers',
            'date-fns',
            'nanoid',
            'decimal.js',
            'clsx',
            'tailwind-merge',
          ],
        },
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.');
          const extension = info.at(-1);
          if (/\.(png|jpe?g|svg|gif|tiff|bmp|ico)$/i.test(assetInfo.name)) {
            return `assets/images/[name]-[hash].${extension}`;
          }
          if (/\.(woff2?|ttf|eot)$/i.test(assetInfo.name)) {
            return `assets/fonts/[name]-[hash].${extension}`;
          }
          if (/\.css$/i.test(assetInfo.name)) {
            return `assets/css/[name]-[hash].${extension}`;
          }
          return `assets/[name]-[hash].${extension}`;
        },
      },
    },
  },
  server: {
    port: 3000,
    host: true,
  },
  preview: {
    port: 3000,
    host: true,
  },
});
