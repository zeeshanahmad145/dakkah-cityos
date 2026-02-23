import { existsSync, cpSync, mkdirSync, readdirSync, writeFileSync, copyFileSync } from "fs";
import { join, resolve } from "path";

const ROOT = resolve(process.cwd());
const SERVER_DIR = join(ROOT, ".medusa", "server");
const ADMIN_SRC = join(ROOT, ".medusa", "server", "public", "commerce", "admin");
const ADMIN_ALT_SRC = join(ROOT, ".medusa", "server", "public", "admin");
const ADMIN_DEST = join(SERVER_DIR, "commerce", "admin");

const ENTRY_SRC = join(ROOT, "scripts", "vercel-entry.js");
const API_DIR = join(SERVER_DIR, "api");
const ENTRY_DEST = join(API_DIR, "index.js");

console.log("[vercel-post-build] Copying Vercel serverless entry point...");
mkdirSync(API_DIR, { recursive: true });
if (existsSync(ENTRY_SRC)) {
  copyFileSync(ENTRY_SRC, ENTRY_DEST);
  console.log("[vercel-post-build] Entry point copied to:", ENTRY_DEST);
} else {
  console.error("[vercel-post-build] ERROR: vercel-entry.js not found at:", ENTRY_SRC);
  process.exit(1);
}

console.log("[vercel-post-build] Checking admin SPA assets...");
console.log("[vercel-post-build] Server dir:", SERVER_DIR);

if (!existsSync(SERVER_DIR)) {
  console.error("[vercel-post-build] ERROR: .medusa/server does not exist!");
  process.exit(1);
}

console.log("[vercel-post-build] Server dir contents:", readdirSync(SERVER_DIR));

const publicDir = join(SERVER_DIR, "public");
if (existsSync(publicDir)) {
  console.log("[vercel-post-build] Public dir contents:", readdirSync(publicDir));
}

let adminFound = false;

if (existsSync(ADMIN_SRC)) {
  console.log("[vercel-post-build] Admin found at:", ADMIN_SRC);
  adminFound = true;
} else if (existsSync(ADMIN_ALT_SRC)) {
  console.log("[vercel-post-build] Admin found at alternate path:", ADMIN_ALT_SRC);
  mkdirSync(join(ADMIN_DEST, ".."), { recursive: true });
  cpSync(ADMIN_ALT_SRC, ADMIN_DEST, { recursive: true });
  adminFound = true;
} else {
  const adminBuildDir = join(ROOT, ".medusa", "admin");
  if (existsSync(adminBuildDir)) {
    console.log("[vercel-post-build] Admin found at .medusa/admin, copying to server output...");
    mkdirSync(join(ADMIN_DEST, ".."), { recursive: true });
    cpSync(adminBuildDir, ADMIN_DEST, { recursive: true });
    adminFound = true;
  }
}

if (adminFound) {
  if (existsSync(ADMIN_DEST)) {
    console.log("[vercel-post-build] Admin SPA deployed at:", ADMIN_DEST);
    console.log("[vercel-post-build] Admin dir contents:", readdirSync(ADMIN_DEST).slice(0, 20));
  }
} else {
  console.warn("[vercel-post-build] WARNING: Admin SPA assets not found!");
  console.warn("[vercel-post-build] The admin dashboard will not be available.");
  console.warn("[vercel-post-build] Checked paths:");
  console.warn("  -", ADMIN_SRC);
  console.warn("  -", ADMIN_ALT_SRC);
  console.warn("  -", join(ROOT, ".medusa", "admin"));

  mkdirSync(ADMIN_DEST, { recursive: true });
  writeFileSync(
    join(ADMIN_DEST, "index.html"),
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

console.log("[vercel-post-build] Done.");
