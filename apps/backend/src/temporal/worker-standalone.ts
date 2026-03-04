/**
 * Standalone Temporal worker entrypoint (CJS-compatible).
 * Run with: pnpm worker:financial (or dispatch/recurring/fulfilment)
 *
 * Auto-loads .env from the monorepo root, validates env vars,
 * and starts a single Temporal worker for the specified task queue.
 */
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";
import { createLogger } from "../lib/logger";

const logger = createLogger("temporal:worker-standalone");

// ── Load .env (walks up to find monorepo root .env) ───────────────────────
function loadEnv() {
  const dirs = [
    resolve(__dirname, "../../.."), // apps/backend → monorepo root
    resolve(__dirname, "../../../."),
    resolve(__dirname, "../../../../"),
  ];
  for (const dir of dirs) {
    const envPath = resolve(dir, ".env");
    if (existsSync(envPath)) {
      const raw = readFileSync(envPath, "utf8");
      for (const line of raw.split("\n")) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) continue;
        const eqIdx = trimmed.indexOf("=");
        if (eqIdx === -1) continue;
        const key = trimmed.slice(0, eqIdx).trim();
        const val = trimmed
          .slice(eqIdx + 1)
          .trim()
          .replace(/^["']|["']$/g, "");
        if (key && !(key in process.env)) process.env[key] = val;
      }
      logger.info(`[worker-standalone] Loaded env from ${envPath}`);
      return;
    }
  }
  logger.warn(
    "[worker-standalone] No .env file found — using process environment only",
  );
}

async function main() {
  loadEnv();

  const address = process.env.TEMPORAL_ADDRESS;
  const namespace = process.env.TEMPORAL_NAMESPACE;
  const apiKey = process.env.TEMPORAL_API_KEY;
  const taskQueue = process.env.TEMPORAL_TASK_QUEUE || "uce-commerce-financial";

  if (!address || !namespace || !apiKey) {
    logger.error("[worker-standalone] Missing required Temporal env vars:");
    logger.error(`  TEMPORAL_ADDRESS   = ${address || "MISSING"}`);
    logger.error(`  TEMPORAL_NAMESPACE = ${namespace || "MISSING"}`);
    logger.error(`  TEMPORAL_API_KEY   = ${apiKey ? "set" : "MISSING"}`);
    process.exit(1);
  }

  logger.info(`[worker-standalone] Starting worker for queue: ${taskQueue}`);
  logger.info(`[worker-standalone] Namespace: ${namespace}`);
  logger.info(`[worker-standalone] Address:   ${address}`);

  // ── Dynamically import Temporal SDK ────────────────────────────────────
  let NativeConnection: any, Worker: any;
  try {
    const workerSdk = await import("@temporalio/worker");
    NativeConnection = workerSdk.NativeConnection;
    Worker = workerSdk.Worker;
  } catch (err: any) {
    logger.error(
      `[worker-standalone] Failed to load @temporalio/worker: ${err.message}`,
    );
    process.exit(1);
  }

  // ── Import activities ────────────────────────────────────────────────
  const { registerActivities } = await import("./activities.js");

  // Minimal stub container for standalone mode (no Medusa DI)
  // registerActivities() calls container.resolve('serviceName') → service proxy
  const containerShim = {
    resolve(serviceName: string) {
      return new Proxy({} as any, {
        get(_: any, method: string | symbol) {
          return async (..._args: any[]) => {
            logger.warn(
              `[worker-standalone] Stub: ${serviceName}.${String(method)} called (no-op in standalone mode)`,
            );
            return null;
          };
        },
      });
    },
  };

  const activities = registerActivities(containerShim);

  // ── Connect to Temporal Cloud ────────────────────────────────────────
  const connection = await NativeConnection.connect({
    address,
    tls: true,
    apiKey,
  });
  logger.info(`[worker-standalone] Connected to Temporal Cloud at ${address}`);

  // ── Create worker ─────────────────────────────────────────────────────
  const workflowsPath = require.resolve("./workflows/canonical-workflows");
  const worker = await Worker.create({
    connection,
    namespace,
    taskQueue,
    workflowsPath,
    activities,
  });

  // Graceful shutdown
  let shuttingDown = false;
  const shutdown = () => {
    if (shuttingDown) return;
    shuttingDown = true;
    logger.info(`[worker-standalone] Shutting down (${taskQueue})...`);
    worker.shutdown();
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);

  logger.info(`[worker-standalone] ✅ Worker polling ${taskQueue}`);
  await worker.run();
  logger.info("[worker-standalone] Worker stopped");
}

main().catch((err) => {
  logger.error(`[worker-standalone] Fatal error: ${err.message}`);
  process.exit(1);
});
