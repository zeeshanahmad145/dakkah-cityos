import { existsSync, cpSync, mkdirSync, readdirSync, writeFileSync, copyFileSync, readFileSync } from "fs";
import { join, resolve } from "path";

const ROOT = resolve(process.cwd());
const SERVER_DIR = join(ROOT, ".medusa", "server");
const ADMIN_SRC = join(ROOT, ".medusa", "server", "public", "commerce", "admin");
const ADMIN_ALT_SRC = join(ROOT, ".medusa", "server", "public", "admin");
const ENTRY_SRC = join(ROOT, "scripts", "vercel-entry.js");

const OUTPUT_DIR = join(ROOT, ".vercel", "output");
const STATIC_DIR = join(OUTPUT_DIR, "static");
const FUNC_DIR = join(OUTPUT_DIR, "functions", "api", "index.func");
const MEDUSA_DIR = join(FUNC_DIR, "medusa-server");

console.log("[vercel-post-build] Building Vercel Build Output API v3 structure...");

if (!existsSync(SERVER_DIR)) {
  console.error("[vercel-post-build] ERROR: .medusa/server does not exist!");
  process.exit(1);
}

mkdirSync(OUTPUT_DIR, { recursive: true });
mkdirSync(STATIC_DIR, { recursive: true });
mkdirSync(FUNC_DIR, { recursive: true });
mkdirSync(MEDUSA_DIR, { recursive: true });

console.log("[vercel-post-build] Step 1: Copy Medusa server output to function subdirectory...");
cpSync(SERVER_DIR, MEDUSA_DIR, { recursive: true });

console.log("[vercel-post-build] Step 2: Copy serverless entry point as index.js at function root...");
if (existsSync(ENTRY_SRC)) {
  copyFileSync(ENTRY_SRC, join(FUNC_DIR, "index.js"));
  console.log("[vercel-post-build] Entry point copied to function root");
} else {
  console.error("[vercel-post-build] ERROR: vercel-entry.js not found at:", ENTRY_SRC);
  process.exit(1);
}

console.log("[vercel-post-build] Step 3: Create .vc-config.json...");
writeFileSync(
  join(FUNC_DIR, ".vc-config.json"),
  JSON.stringify(
    {
      runtime: "nodejs20.x",
      handler: "index.js",
      maxDuration: 60,
      memory: 1024,
      launcherType: "Nodejs",
    },
    null,
    2
  )
);

console.log("[vercel-post-build] Step 4: Ensure package.json at function root...");
const serverPkgPath = join(SERVER_DIR, "package.json");
if (existsSync(serverPkgPath)) {
  copyFileSync(serverPkgPath, join(FUNC_DIR, "package.json"));
  console.log("[vercel-post-build] package.json copied to function root");
}

console.log("[vercel-post-build] Step 5: Handle admin SPA static assets...");
let adminFound = false;
const ADMIN_STATIC_DEST = join(STATIC_DIR, "commerce", "admin");

if (existsSync(ADMIN_SRC)) {
  console.log("[vercel-post-build] Admin found at:", ADMIN_SRC);
  mkdirSync(ADMIN_STATIC_DEST, { recursive: true });
  cpSync(ADMIN_SRC, ADMIN_STATIC_DEST, { recursive: true });
  adminFound = true;
} else if (existsSync(ADMIN_ALT_SRC)) {
  console.log("[vercel-post-build] Admin found at alternate path:", ADMIN_ALT_SRC);
  mkdirSync(ADMIN_STATIC_DEST, { recursive: true });
  cpSync(ADMIN_ALT_SRC, ADMIN_STATIC_DEST, { recursive: true });
  adminFound = true;
} else {
  const adminBuildDir = join(ROOT, ".medusa", "admin");
  if (existsSync(adminBuildDir)) {
    console.log("[vercel-post-build] Admin found at .medusa/admin");
    mkdirSync(ADMIN_STATIC_DEST, { recursive: true });
    cpSync(adminBuildDir, ADMIN_STATIC_DEST, { recursive: true });
    adminFound = true;
  }
}

if (adminFound) {
  console.log("[vercel-post-build] Admin SPA deployed to static output");
} else {
  console.warn("[vercel-post-build] WARNING: Admin SPA assets not found!");
  mkdirSync(ADMIN_STATIC_DEST, { recursive: true });
  writeFileSync(
    join(ADMIN_STATIC_DEST, "index.html"),
    `<!DOCTYPE html>
<html>
<head><title>Admin Build Missing</title></head>
<body>
<h1>Admin Dashboard Not Available</h1>
<p>The admin SPA was not built. Ensure DISABLE_MEDUSA_ADMIN is not set to "true" and redeploy.</p>
</body>
</html>`
  );
}

console.log("[vercel-post-build] Step 6: Create Build Output config.json...");
const config = {
  version: 3,
  routes: [
    {
      src: "/commerce/admin/assets/(.*)",
      headers: {
        "Cache-Control": "public, max-age=31536000, immutable",
      },
      continue: true,
    },
    {
      src: "/commerce/admin$",
      dest: "/commerce/admin/index.html",
    },
    {
      src: "/commerce/admin/(.*)",
      dest: "/commerce/admin/index.html",
    },
    {
      src: "/(platform|store|admin|auth|webhooks)/(.*)",
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type,Authorization,x-publishable-api-key,x-medusa-access-token",
        "Access-Control-Allow-Credentials": "true",
      },
      continue: true,
    },
    {
      src: "/health",
      dest: "/api/index",
    },
    {
      src: "/(platform|store|admin|auth|webhooks)(.*)",
      dest: "/api/index",
    },
    {
      src: "/(.*)",
      dest: "/api/index",
    },
  ],
};

writeFileSync(join(OUTPUT_DIR, "config.json"), JSON.stringify(config, null, 2));

console.log("[vercel-post-build] Build Output API v3 structure created:");
console.log("[vercel-post-build]   Static:", STATIC_DIR);
console.log("[vercel-post-build]   Function:", FUNC_DIR);
console.log("[vercel-post-build]   Medusa server:", MEDUSA_DIR);
console.log("[vercel-post-build]   Config:", join(OUTPUT_DIR, "config.json"));
console.log("[vercel-post-build] Function dir contents:", readdirSync(FUNC_DIR));
console.log("[vercel-post-build] Done.");
