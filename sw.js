// Blaze service worker — makes the site installable and work offline.
// Network-first so updates always show; falls back to cache when offline.
const CACHE = "blaze-v1";

const ASSETS = [
  "./", "./index.html", "./manifest.webmanifest", "./css/style.css",
  "./js/main.js", "./js/blaze.js", "./js/brain.js", "./js/dialogue.js", "./js/nlp.js",
  "./js/grammar.js", "./js/rng.js", "./js/store.js", "./js/photos.js",
  "./content/greetings.js", "./content/compliments.js", "./content/flirty.js",
  "./content/jokes.js", "./content/care.js", "./content/encourage.js",
  "./content/musings.js", "./content/intents.js", "./content/inside.js",
  "./content/stories.js", "./content/surprises.js",
  "./assets/favicon.svg", "./assets/icon-192.png", "./assets/icon-512.png", "./assets/icon-maskable-512.png",
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET" || new URL(req.url).origin !== self.location.origin) return;
  e.respondWith(
    fetch(req)
      .then((res) => { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); return res; })
      .catch(() => caches.match(req).then((r) => r || caches.match("./index.html")))
  );
});
