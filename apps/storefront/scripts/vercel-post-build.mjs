import { existsSync, readFileSync, writeFileSync } from "fs";
import { join, resolve } from "path";

const ROOT = resolve(process.cwd());
const BACKEND_URL = process.env.MEDUSA_BACKEND_URL || "https://dakkah-cityos-medusa-backend.vercel.app";

const OUTPUT_CONFIG = join(ROOT, ".vercel", "output", "config.json");

console.log("[storefront-post-build] Backend URL:", BACKEND_URL);
console.log("[storefront-post-build] Looking for:", OUTPUT_CONFIG);

if (!existsSync(OUTPUT_CONFIG)) {
  console.log("[storefront-post-build] No .vercel/output/config.json found — skipping rewrite injection");
  process.exit(0);
}

const config = JSON.parse(readFileSync(OUTPUT_CONFIG, "utf-8"));
console.log("[storefront-post-build] Existing routes count:", config.routes?.length || 0);

const proxyRewrites = [
  { src: "/platform/(.*)", dest: `${BACKEND_URL}/platform/$1` },
  { src: "/store/(.*)", dest: `${BACKEND_URL}/store/$1` },
  { src: "/admin/(.*)", dest: `${BACKEND_URL}/admin/$1` },
  { src: "/auth/(.*)", dest: `${BACKEND_URL}/auth/$1` },
  { src: "/commerce/(.*)", dest: `${BACKEND_URL}/commerce/$1` },
];

if (!config.routes) {
  config.routes = [];
}

const existingSrcs = new Set(config.routes.map((r) => r.src));
const newRewrites = proxyRewrites.filter((r) => !existingSrcs.has(r.src));

if (newRewrites.length > 0) {
  config.routes = [...newRewrites, ...config.routes];
  console.log("[storefront-post-build] Injected", newRewrites.length, "proxy rewrites");
} else {
  console.log("[storefront-post-build] All proxy rewrites already present");
}

writeFileSync(OUTPUT_CONFIG, JSON.stringify(config, null, 2));
console.log("[storefront-post-build] Updated config.json with", config.routes.length, "total routes");
console.log("[storefront-post-build] Done.");
