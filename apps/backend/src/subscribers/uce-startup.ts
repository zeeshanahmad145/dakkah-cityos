/**
 * WorkflowPolicy Startup Subscriber
 *
 * Seeds the 8 canonical WorkflowPolicy governance rows on every startup
 * if they don't already exist. Runs as a Medusa subscriber on app.started.
 *
 * This ensures workflow governance is enforced from first boot —
 * no manual seeding step required.
 */
import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework";
import {
  startTemporalWorker,
  seedWorkflowPolicies,
  registerWithContainer,
} from "../temporal/worker";
import { default as seedReconciliationConfig } from "../jobs/seed-reconciliation-config";
import { createLogger } from "../lib/logger";

const logger = createLogger("subscriber:startup");

export default async function onStartup({ container }: SubscriberArgs<void>) {
  // 1. Seed WorkflowPolicy governance rows
  try {
    await seedWorkflowPolicies(container);
    logger.info("WorkflowPolicy: governance rows seeded");
  } catch (err: any) {
    logger.warn("WorkflowPolicy seed error (non-fatal):", err.message);
  }

  // 2. Seed ReconciliationConfig default if not present
  try {
    const reconciliationConfig = container.resolve(
      "reconciliationConfig",
    ) as any;
    const existing = await reconciliationConfig
      .getActiveConfig?.()
      .catch(() => null);
    if (!existing) {
      await seedReconciliationConfig(container);
      logger.info("ReconciliationConfig: default config seeded on startup");
    }
  } catch (err: any) {
    logger.warn("ReconciliationConfig seed on startup skipped:", err.message);
  }

  // 3. Start Temporal worker (if TEMPORAL_AUTO_START env is set)
  // By default this is opt-in to avoid running a worker in the web process.
  // Set TEMPORAL_AUTO_START=true in the Temporal worker process's env.
  if (process.env.TEMPORAL_AUTO_START === "true") {
    registerWithContainer(container); // Wire activities to real Medusa services
    startTemporalWorker().catch((err: Error) => {
      logger.error("Temporal worker startup failed:", err.message);
    });
    logger.info(
      "Temporal worker: starting in-process (TEMPORAL_AUTO_START=true)",
    );
  } else {
    logger.info(
      "Temporal worker: not started (set TEMPORAL_AUTO_START=true to enable)",
    );
  }
}

export const config: SubscriberConfig = {
  event: "app.started",
};
