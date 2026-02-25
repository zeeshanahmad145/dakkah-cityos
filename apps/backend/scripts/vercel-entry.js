/**
 * Vercel Serverless Entry for Medusa v2
 *
 * Medusa v2 uses the same `loader({ directory, expressApp })` API as v1.
 * The built .medusa/server directory is mounted as "medusa-server/" inside
 * this function, so we resolve the loader from that bundled node_modules.
 */
const express = require("express");
const path = require("path");

// Post-build copies .medusa/server → medusa-server/ inside the function dir
const MEDUSA_SERVER = path.resolve(__dirname, "medusa-server");

const app = express();

// CORS for all routes
app.use((req, res, next) => {
  const origin = req.headers.origin;
  res.setHeader("Access-Control-Allow-Origin", origin || "*");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET,POST,PUT,PATCH,DELETE,OPTIONS",
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type,Authorization,x-publishable-api-key,x-medusa-access-token",
  );
  res.setHeader("Access-Control-Max-Age", "86400");
  if (req.method === "OPTIONS") return res.status(204).end();
  next();
});

let initPromise = null;
let initialized = false;
let initError = null;

async function initialize() {
  if (initialized) return;
  if (initError) throw initError;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      console.log("[vercel-entry] Starting Medusa v2 from:", MEDUSA_SERVER);
      console.log(
        "[vercel-entry] DATABASE_URL set:",
        !!process.env.DATABASE_URL,
      );
      console.log("[vercel-entry] REDIS_URL set:", !!process.env.REDIS_URL);
      console.log("[vercel-entry] JWT_SECRET set:", !!process.env.JWT_SECRET);
      console.log("[vercel-entry] NODE_ENV:", process.env.NODE_ENV);

      // Load the Medusa loader from the bundled server output.
      // The .medusa/server directory has its own node_modules with @medusajs/medusa.
      const loaderPath = path.join(
        MEDUSA_SERVER,
        "node_modules",
        "@medusajs",
        "medusa",
        "dist",
        "loaders",
      );
      console.log("[vercel-entry] Loading loader from:", loaderPath);

      let loadMedusa;
      try {
        loadMedusa = require(loaderPath).default;
      } catch (e) {
        // Fallback: try loading from the medusa-server directory itself
        // (medusa build may produce a self-contained index.js that starts a server)
        console.warn(
          "[vercel-entry] Loader not found in medusa-server/node_modules, trying medusa-server/index.js",
        );
        const serverIndex = require(path.join(MEDUSA_SERVER, "index.js"));
        // If it exports an express app directly, use it
        if (typeof serverIndex === "function") {
          // Already an Express app or handler — attach health route
          serverIndex.get?.("/health", (_, res) =>
            res.status(200).json({ status: "ok" }),
          );
          initialized = true;
          // Replace app handlers with the server index
          app.use(serverIndex);
          console.log("[vercel-entry] Using medusa-server/index.js as handler");
          return;
        }
        throw new Error(
          `Cannot find Medusa loader. Loader error: ${e.message}`,
        );
      }

      await loadMedusa({
        directory: MEDUSA_SERVER,
        expressApp: app,
      });

      // Health check not mounted by Medusa v2 loader by default
      app.get("/health", (_, res) =>
        res.status(200).json({ status: "ok", serverless: true }),
      );

      initialized = true;
      console.log("[vercel-entry] Medusa v2 initialized successfully");
    } catch (err) {
      initPromise = null;
      initError = err;
      console.error("[vercel-entry] INIT FAILED:", err.message);
      console.error("[vercel-entry] Stack:", err.stack);
      throw err;
    }
  })();

  return initPromise;
}

module.exports = async (req, res) => {
  try {
    await initialize();
    app(req, res);
  } catch (err) {
    console.error("[vercel-entry] Request failed:", err.message);
    if (!res.headersSent) {
      res.status(500).json({
        error: "Internal Server Error",
        message: err.message, // Always expose for debugging
        hint: "Check Vercel function logs for full stack trace",
      });
    }
  }
};
