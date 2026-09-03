const CACHE_NAME = "moto-progress-v1";

// Ibiri ku "app shell" gusa (ntabwo dubika amakuru ya Firestore
// cyangwa ay'ibanga — ayo agomba kuvuye kuri seriveri buri gihe).
const APP_SHELL = [
  "./",
  "./index.html",
  "./style.css",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", event => {
  const url = new URL(event.request.url);

  // Ntitwifashisha cache kuri Firebase/Firestore/API cyangwa
  // ibindi bisaba amakuru agezweho buri gihe — dusiga izo request
  // zigafata neza uburyo busanzwe (network).
  if (
    url.origin !== self.location.origin ||
    url.pathname.includes("firestore") ||
    url.hostname.includes("googleapis") ||
    url.hostname.includes("gstatic")
  ) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then(cached => {
      return cached || fetch(event.request).catch(() =>
        caches.match("./index.html")
      );
    })
  );
});
