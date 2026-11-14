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
    "revision": "eb8b114e25de447eb385afa107ff2c47"
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
    "url": "icons/icon.svg",
    "revision": "aed1b7428f4eebbba08c9b7a666e8a8e"
  },
  {
    "url": "assets/js/vendor-BTP6EV9y.js",
    "revision": null
  },
  {
    "url": "assets/js/utils-B7Le-tCd.js",
    "revision": null
  },
  {
    "url": "assets/js/ui-Cr18-ahF.js",
    "revision": null
  },
  {
    "url": "assets/js/pdf-Bjalvr-V.js",
    "revision": null
  },
  {
    "url": "assets/js/index-zQAP0Thv.js",
    "revision": null
  },
  {
    "url": "assets/js/db-CBQ22Fug.js",
    "revision": null
  },
  {
    "url": "assets/css/index-IJmKdLVL.css",
    "revision": null
  },
  {
    "url": "manifest.webmanifest",
    "revision": "777e76fdb0148f5a7c27a1a612a08e69"
  }
], {});
workbox_precaching_cleanupOutdatedCaches();workbox_routing_registerRoute(new workbox_routing_NavigationRoute(workbox_precaching_createHandlerBoundToURL("index.html")));
workbox_routing_registerRoute(/^https:\/\/fonts\.googleapis\.com\/.*/i, new workbox_strategies_CacheFirst({ "cacheName":"google-fonts-cache", plugins: [new workbox_expiration_ExpirationPlugin({ maxEntries: 10, maxAgeSeconds: 31536000 }), new workbox_cacheable_response_CacheableResponsePlugin({ statuses: [ 0, 200 ] })] }), 'GET');
workbox_routing_registerRoute(/^https:\/\/fonts\.gstatic\.com\/.*/i, new workbox_strategies_CacheFirst({ "cacheName":"gstatic-fonts-cache", plugins: [new workbox_expiration_ExpirationPlugin({ maxEntries: 10, maxAgeSeconds: 31536000 }), new workbox_cacheable_response_CacheableResponsePlugin({ statuses: [ 0, 200 ] })] }), 'GET');


