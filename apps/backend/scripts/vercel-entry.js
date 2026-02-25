/**
 * Vercel Serverless Entry for Medusa v2
 *
 * Medusa v2 `medusa build` output in .medusa/server is a self-contained
 * Node.js server. We load it here as a serverless function by requiring
 * its built Express app and re-using it across invocations.
 */
const path = require("path");

// The post-build script copies .medusa/server → medusa-server/ inside this func dir
const MEDUSA_SERVER = path.resolve(__dirname, "medusa-server");

let appPromise = null;

async function getApp() {
  if (appPromise) return appPromise;

  appPromise = (async () => {
    try {
      console.log("[vercel-entry] Loading Medusa v2 from:", MEDUSA_SERVER);
      console.log(
        "[vercel-entry] DATABASE_URL set:",
        !!process.env.DATABASE_URL,
      );
      console.log("[vercel-entry] REDIS_URL set:", !!process.env.REDIS_URL);
      console.log("[vercel-entry] JWT_SECRET set:", !!process.env.JWT_SECRET);

      // Medusa v2 exports the Express app from its main entry
      // The built server main file is at medusa-server/index.js
      const medusaMain = require(path.join(MEDUSA_SERVER, "index.js"));

      // Medusa v2 may export { app } or default export the app
      const app = medusaMain?.app || medusaMain?.default?.app || medusaMain;

      if (typeof app !== "function") {
        throw new Error(
          `Medusa v2 index.js did not export a callable app. Got: ${typeof app}. ` +
            `Keys: ${Object.keys(medusaMain || {}).join(", ")}`,
        );
      }

      console.log("[vercel-entry] Medusa v2 app loaded successfully");
      return app;
    } catch (err) {
      appPromise = null; // Allow retry on next request
      console.error("[vercel-entry] Failed to load Medusa:", err.message);
      console.error("[vercel-entry] Stack:", err.stack);
      throw err;
    }
  })();

  return appPromise;
}

// CORS headers applied to all responses
function addCors(res, origin) {
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
}

module.exports = async (req, res) => {
  const origin = req.headers?.origin;
  addCors(res, origin);

  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }

  try {
    const app = await getApp();
    app(req, res);
  } catch (err) {
    console.error("[vercel-entry] Handler error:", err.message);

    const body = {
      error: "Internal Server Error",
      hint: "Medusa backend failed to initialize. Check Vercel function logs.",
    };

    // Expose error details in non-production for debugging
    if (process.env.NODE_ENV !== "production") {
      body.message = err.message;
      body.stack = err.stack;
    }

    if (!res.headersSent) {
      res.status(500).json(body);
    }
  }
};
