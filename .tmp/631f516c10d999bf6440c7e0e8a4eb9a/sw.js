import {registerRoute as workbox_routing_registerRoute} from 'C:/Users/cedri/Downloads/MetalPro_Devis/node_modules/workbox-routing/registerRoute.mjs';
import {ExpirationPlugin as workbox_expiration_ExpirationPlugin} from 'C:/Users/cedri/Downloads/MetalPro_Devis/node_modules/workbox-expiration/ExpirationPlugin.mjs';
import {CacheableResponsePlugin as workbox_cacheable_response_CacheableResponsePlugin} from 'C:/Users/cedri/Downloads/MetalPro_Devis/node_modules/workbox-cacheable-response/CacheableResponsePlugin.mjs';
import {CacheFirst as workbox_strategies_CacheFirst} from 'C:/Users/cedri/Downloads/MetalPro_Devis/node_modules/workbox-strategies/CacheFirst.mjs';
import {clientsClaim as workbox_core_clientsClaim} from 'C:/Users/cedri/Downloads/MetalPro_Devis/node_modules/workbox-core/clientsClaim.mjs';
import {precacheAndRoute as workbox_precaching_precacheAndRoute} from 'C:/Users/cedri/Downloads/MetalPro_Devis/node_modules/workbox-precaching/precacheAndRoute.mjs';
import {cleanupOutdatedCaches as workbox_precaching_cleanupOutdatedCaches} from 'C:/Users/cedri/Downloads/MetalPro_Devis/node_modules/workbox-precaching/cleanupOutdatedCaches.mjs';
import {NavigationRoute as workbox_routing_NavigationRoute} from 'C:/Users/cedri/Downloads/MetalPro_Devis/node_modules/workbox-routing/NavigationRoute.mjs';
import {createHandlerBoundToURL as workbox_precaching_createHandlerBoundToURL} from 'C:/Users/cedri/Downloads/MetalPro_Devis/node_modules/workbox-precaching/createHandlerBoundToURL.mjs';/**
 * Welcome to your Workbox-powered service worker!
 *
 * You'll need to register this file in your web app.
 * See https://goo.gl/nhQhGp
 *
 * The rest of the code is auto-generated. Please don't update this file
 * directly; instead, make changes to your Workbox build configuration
 * and re-run your build process.
 * See https://goo.gl/2aRDsh
 */




self.skipWaiting();
workbox_core_clientsClaim();
/**
 * The precacheAndRoute() method efficiently caches and responds to
 * requests for URLs in the manifest.
 * See https://goo.gl/S9QRab
 */
workbox_precaching_precacheAndRoute([
  {
    "url": "registerSW.js",
    "revision": "1872c500de691dce40960bb85481de07"
  },
  {
    "url": "offline.html",
    "revision": "534665ce8a4e45a4130695e1580e5620"
  },
  {
    "url": "index.html",
    "revision": "b329f6428e2fc4776093f5f51094cfbc"
  },
  {
    "url": "icons.svg",
    "revision": "3b4fcfcf393eca4d264dca4a4663bc37"
  },
  {
    "url": "favicon.svg",
    "revision": "7e840862161341271697daa99a40d76b"
  },
  {
    "url": "icons/manifest-icon-512.maskable.png",
    "revision": "dc6e0b4d1f5c23c1813d662513fad720"
  },
  {
    "url": "icons/manifest-icon-192.maskable.png",
    "revision": "5ff4009a8518a49acb140a2837c4f5a8"
  },
  {
    "url": "icons/icon.svg",
    "revision": "aed1b7428f4eebbba08c9b7a666e8a8e"
  },
  {
    "url": "icons/icon-96x96.png",
    "revision": "dc596a34477f8e6b145b3742150a1342"
  },
  {
    "url": "icons/icon-72x72.png",
    "revision": "a62a8f77b9cc1adaf070ea4748c1b3be"
  },
  {
    "url": "icons/icon-512x512.png",
    "revision": "dc6e0b4d1f5c23c1813d662513fad720"
  },
  {
    "url": "icons/icon-384x384.png",
    "revision": "b7759f2a906e12970be0aad3b79f717d"
  },
  {
    "url": "icons/icon-192x192.png",
    "revision": "5ff4009a8518a49acb140a2837c4f5a8"
  },
  {
    "url": "icons/icon-152x152.png",
    "revision": "751e03d1b0155bfab1af45538977efab"
  },
  {
    "url": "icons/icon-144x144.png",
    "revision": "9841e2e0059f8dc060101c70ac6fdf54"
  },
  {
    "url": "icons/icon-128x128.png",
    "revision": "aae137e9a762ad3cef208e4bb9aa016e"
  },
  {
    "url": "icons/apple-icon-180.png",
    "revision": "73a04c15ce40350883c6f3e4dbd1fe39"
  },
  {
    "url": "assets/js/vendor-zRYZ2Pxh.js",
    "revision": null
  },
  {
    "url": "assets/js/utils-KpUQA-15.js",
    "revision": null
  },
  {
    "url": "assets/js/ui-DpNNQiH7.js",
    "revision": null
  },
  {
    "url": "assets/js/pdf-ev7no_DA.js",
    "revision": null
  },
  {
    "url": "assets/js/index-DYl5VDX0.js",
    "revision": null
  },
  {
    "url": "assets/js/db-DA4aiDKg.js",
    "revision": null
  },
  {
    "url": "assets/css/index-IJmKdLVL.css",
    "revision": null
  },
  {
    "url": "icons/icon-128x128.png",
    "revision": "aae137e9a762ad3cef208e4bb9aa016e"
  },
  {
    "url": "icons/icon-144x144.png",
    "revision": "9841e2e0059f8dc060101c70ac6fdf54"
  },
  {
    "url": "icons/icon-152x152.png",
    "revision": "751e03d1b0155bfab1af45538977efab"
  },
  {
    "url": "icons/icon-192x192.png",
    "revision": "5ff4009a8518a49acb140a2837c4f5a8"
  },
  {
    "url": "icons/icon-384x384.png",
    "revision": "b7759f2a906e12970be0aad3b79f717d"
  },
  {
    "url": "icons/icon-512x512.png",
    "revision": "dc6e0b4d1f5c23c1813d662513fad720"
  },
  {
    "url": "icons/icon-72x72.png",
    "revision": "a62a8f77b9cc1adaf070ea4748c1b3be"
  },
  {
    "url": "icons/icon-96x96.png",
    "revision": "dc596a34477f8e6b145b3742150a1342"
  },
  {
    "url": "manifest.webmanifest",
    "revision": "81b02c711e6a9edc536081caa2071c9d"
  }
], {});
workbox_precaching_cleanupOutdatedCaches();workbox_routing_registerRoute(new workbox_routing_NavigationRoute(workbox_precaching_createHandlerBoundToURL("index.html")));
workbox_routing_registerRoute(/^https:\/\/fonts\.googleapis\.com\/.*/i, new workbox_strategies_CacheFirst({ "cacheName":"google-fonts-cache", plugins: [new workbox_expiration_ExpirationPlugin({ maxEntries: 10, maxAgeSeconds: 31536000 }), new workbox_cacheable_response_CacheableResponsePlugin({ statuses: [ 0, 200 ] })] }), 'GET');
workbox_routing_registerRoute(/^https:\/\/fonts\.gstatic\.com\/.*/i, new workbox_strategies_CacheFirst({ "cacheName":"gstatic-fonts-cache", plugins: [new workbox_expiration_ExpirationPlugin({ maxEntries: 10, maxAgeSeconds: 31536000 }), new workbox_cacheable_response_CacheableResponsePlugin({ statuses: [ 0, 200 ] })] }), 'GET');


