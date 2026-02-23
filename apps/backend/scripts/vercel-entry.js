const express = require("express");
const path = require("path");

const app = express();

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  } else {
    res.setHeader("Access-Control-Allow-Origin", "*");
  }
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET,POST,PUT,PATCH,DELETE,OPTIONS"
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type,Authorization,x-publishable-api-key,x-medusa-access-token"
  );
  res.setHeader("Access-Control-Max-Age", "86400");

  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }

  next();
});

let initPromise = null;
let initialized = false;

async function initialize() {
  if (initialized) return;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      const directory = path.resolve(__dirname, "..");
      const loader = require("@medusajs/medusa/dist/loaders").default;

      const { shutdown } = await loader({
        directory,
        expressApp: app,
      });

      app.get("/health", (_, res) => {
        res.status(200).send("OK");
      });

      initialized = true;
      console.log("[vercel-entry] Medusa initialized successfully");
    } catch (err) {
      initPromise = null;
      console.error("[vercel-entry] Failed to initialize Medusa:", err);
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
    console.error("[vercel-entry] Request error:", err.message);
    res.status(500).json({
      error: "Internal Server Error",
      message:
        process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
};
