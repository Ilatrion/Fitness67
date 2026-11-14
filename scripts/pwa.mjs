import { readFile, writeFile, readdir } from "node:fs/promises";
let html = await readFile("dist/index.html", "utf8");
html = html
  .replace(
    "<head>",
    '<head><link rel="manifest" href="/manifest.webmanifest"><meta name="theme-color" content="#101413"><meta name="apple-mobile-web-app-capable" content="yes"><meta name="apple-mobile-web-app-status-bar-style" content="black-translucent"><meta name="apple-mobile-web-app-title" content="Fitness67"><link rel="apple-touch-icon" href="/icon-192.png">',
  )
  .replace(
    "</body>",
    `<script>if('serviceWorker' in navigator){window.addEventListener('load',()=>navigator.serviceWorker.register('/sw.js').catch(()=>{}))}</script></body>`,
  );
await writeFile("dist/index.html", html);
await writeFile(
  "dist/manifest.webmanifest",
  JSON.stringify({
    id: "/",
    name: "Fitness67",
    short_name: "Fitness67",
    description: "Дневник питания, калории и БЖУ",
    lang: "ru",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#101413",
    theme_color: "#101413",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any maskable",
      },
    ],
  }),
);
const files = [];
async function walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const p = dir + "/" + entry.name;
    if (entry.isDirectory()) await walk(p);
    else if (!p.endsWith("/sw.js") && !p.endsWith(".map"))
      files.push("/" + p.slice(5));
  }
}
await walk("dist");
const version = Date.now();
await writeFile(
  "dist/sw.js",
  `const CACHE='fitness67-${version}';const FILES=${JSON.stringify(files)};self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES)).then(()=>self.skipWaiting()))});self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('fitness67-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});self.addEventListener('fetch',e=>{const url=new URL(e.request.url);if(e.request.method!=='GET'||url.origin!==self.location.origin||url.pathname.startsWith('/api/'))return;if(e.request.mode==='navigate'){e.respondWith(fetch(e.request).catch(()=>caches.match('/index.html')));return;}if(FILES.includes(url.pathname))e.respondWith(caches.match(e.request).then(c=>c||fetch(e.request)));});`,
);
console.log(
  "Fitness67 PWA: manifest, icons and offline application shell prepared.",
);
