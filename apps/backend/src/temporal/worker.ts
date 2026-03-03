/**
 * Temporal Worker — UCE Canonical Workflows
 *
 * Connects to Temporal Cloud and polls task queues for workflow execution.
 *
 * Env configuration (Temporal Cloud):
 *   TEMPORAL_ADDRESS     — Cloud endpoint: <namespace>.tmprl.cloud:7233
 *   TEMPORAL_NAMESPACE   — Your Temporal Cloud namespace (e.g. dakkah-cityos.abc123)
 *   TEMPORAL_TASK_QUEUE  — Which queue to poll (default: uce-commerce-financial)
 *
 * Authentication — use ONE of:
 *   Option A: mTLS (recommended for production)
 *     TEMPORAL_TLS_CERT  — Path to client cert PEM (from Temporal Cloud console)
 *     TEMPORAL_TLS_KEY   — Path to client key PEM
 *
 *   Option B: API Key (simpler, Temporal Cloud ≥ 2.x)
 *     TEMPORAL_API_KEY   — API key from Temporal Cloud console
 *
 * Task Queue Topology (run one worker process per queue for isolation):
 *   uce-commerce-financial   → one_time_goods, auction_settlement, milestone_escrow
 *   uce-commerce-dispatch    → on_demand_dispatch
 *   uce-commerce-recurring   → subscription_billing, usage_metering
 *   uce-commerce-fulfilment  → booking_service, trade_in_valuation
 */
import { readFileSync } from "fs";
import { createLogger } from "../lib/logger";

const logger = createLogger("temporal:worker");

// Build TLS config for Temporal Cloud connection
function buildConnectionOptions() {
  const address = process.env.TEMPORAL_ADDRESS; // e.g. dakkah-cityos.abc123.tmprl.cloud:7233
  const apiKey = process.env.TEMPORAL_API_KEY; // Option B: API key auth
  const certPath = process.env.TEMPORAL_TLS_CERT; // Option A: mTLS cert path
  const keyPath = process.env.TEMPORAL_TLS_KEY; // Option A: mTLS key path

  if (!address) {
    throw new Error(
      "TEMPORAL_ADDRESS is required. Set it to your Temporal Cloud namespace endpoint, " +
        "e.g. dakkah-cityos.abc123.tmprl.cloud:7233",
    );
  }

  const opts: Record<string, unknown> = { address };

  if (apiKey) {
    // API Key auth (Temporal Cloud ≥ 2.x)
    opts.apiKey = apiKey;
    opts.tls = true; // Cloud requires TLS even with API key
    logger.info("Temporal Cloud: using API key auth");
  } else if (certPath && keyPath) {
    // mTLS auth
    opts.tls = {
      clientCertPair: {
        crt: readFileSync(certPath),
        key: readFileSync(keyPath),
      },
    };
    logger.info("Temporal Cloud: using mTLS auth");
  } else {
    logger.warn(
      "Temporal Cloud: no auth configured. Set TEMPORAL_API_KEY or TEMPORAL_TLS_CERT+TEMPORAL_TLS_KEY. " +
        "Connection will likely fail against Temporal Cloud.",
    );
  }

  return opts;
}

async function startTemporalWorker() {
  let Worker: any, NativeConnection: any;
  try {
    ({ NativeConnection } = await import("@temporalio/client" as any));
    const workerModule = await import("@temporalio/worker" as any);
    Worker = workerModule.Worker;
    ({ NativeConnection } = workerModule);
  } catch {
    logger.warn(
      "Temporal SDK not installed. Skipping worker startup. Install @temporalio/client @temporalio/worker @temporalio/workflow.",
    );
    return;
  }

  const namespace = process.env.TEMPORAL_NAMESPACE ?? "default";
  const taskQueue = process.env.TEMPORAL_TASK_QUEUE ?? "uce-commerce-financial";

  const connectionOpts = buildConnectionOptions();
  const connection = await NativeConnection.connect(connectionOpts);

  const worker = await Worker.create({
    connection,
    namespace,
    taskQueue,
    workflowsPath: require.resolve("./workflows/canonical-workflows"),
    activities: _registeredActivities,
  });

  logger.info(
    `Temporal Cloud worker started: namespace=${namespace} taskQueue=${taskQueue} address=${connectionOpts.address}`,
  );
  logger.info(
    "Workflow templates: one_time_goods, booking_service, subscription_billing, usage_metering, milestone_escrow, auction_settlement, on_demand_dispatch, trade_in_valuation",
  );

  await worker.run();
}

// Activities store — populated by registerWithContainer()
let _registeredActivities: Record<string, (...args: any[]) => any> = {};

/**
 * Wire Temporal activities to a live Medusa container.
 * Call this before startTemporalWorker() from the startup subscriber.
 *
 * import { registerWithContainer } from '../temporal/worker'
 * registerWithContainer(container)
 * await startTemporalWorker()
 */
export function registerWithContainer(container: any): void {
  const { registerActivities } =
    require("./activities") as typeof import("./activities");
  _registeredActivities = registerActivities(container);
  createLogger("temporal:worker").info(
    "Activities registered from Medusa container",
  );
}

// Run if invoked directly
if (require.main === module) {
  startTemporalWorker().catch((err) => {
    console.error("Temporal worker fatal error:", err);
    process.exit(1);
  });
}

export { startTemporalWorker };

/**
 * Workflow governance — WorkflowPolicy defaults seeded on startup.
 * Call seedWorkflowPolicies(container) from a Medusa subscriber or startup job.
 */
export async function seedWorkflowPolicies(container: any): Promise<void> {
  const logger = createLogger("temporal:seed-policies");
  try {
    const approvalService = container.resolve("approvalWorkflow") as any;

    const DEFAULT_POLICIES = [
      {
        workflow_name: "one_time_goods",
        permitted_launchers: ["system", "admin"],
        override_requires_approval: false,
        rollback_strategy: "graceful",
      },
      {
        workflow_name: "booking_service",
        permitted_launchers: ["system", "vendor"],
        override_requires_approval: false,
        rollback_strategy: "graceful",
      },
      {
        workflow_name: "subscription_billing",
        permitted_launchers: ["system"],
        override_requires_approval: true,
        rollback_strategy: "graceful",
      },
      {
        workflow_name: "usage_metering",
        permitted_launchers: ["system"],
        override_requires_approval: false,
        rollback_strategy: "immediate",
      },
      {
        workflow_name: "milestone_escrow",
        permitted_launchers: ["system", "admin"],
        override_requires_approval: true,
        rollback_strategy: "manual",
      },
      {
        workflow_name: "auction_settlement",
        permitted_launchers: ["system"],
        override_requires_approval: false,
        rollback_strategy: "graceful",
      },
      {
        workflow_name: "on_demand_dispatch",
        permitted_launchers: ["system"],
        override_requires_approval: false,
        rollback_strategy: "immediate",
      },
      {
        workflow_name: "trade_in_valuation",
        permitted_launchers: ["system", "vendor", "admin"],
        override_requires_approval: false,
        rollback_strategy: "graceful",
      },
    ];

    for (const policy of DEFAULT_POLICIES) {
      // Check if already exists
      const existing = await approvalService.listWorkflowPolicies?.({
        workflow_name: policy.workflow_name,
        is_active_version: true,
      });
      if (existing?.length > 0) continue;

      await approvalService.createWorkflowPolicies?.({
        ...policy,
        version: 1,
        is_active_version: true,
        supersedes_id: null,
        audit_all_transitions: true,
        audit_retention_days: 365,
        default_timeout_minutes: 4320, // 3 days
        escalation_after_minutes: 1440, // 24h
        escalation_target: "admin",
        tenant_id: null,
        metadata: null,
      } as any);
      logger.info(`WorkflowPolicy seeded: ${policy.workflow_name}`);
    }
  } catch (err: any) {
    logger.warn(
      "WorkflowPolicy seed skipped (approval-workflow module may not support WorkflowPolicy yet):",
      err.message,
    );
  }
}
