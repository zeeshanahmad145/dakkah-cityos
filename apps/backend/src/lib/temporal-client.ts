/**
 * Temporal Client — UCE Canonical Workflows
 *
 * Provides a singleton Temporal Client connected to Temporal Cloud.
 * Uses API key auth (TEMPORAL_API_KEY env var) over TLS.
 *
 * To start a canonical UCE workflow from any Medusa API route or subscriber:
 *   import { startCanonicalWorkflow } from '../lib/temporal-client'
 *   await startCanonicalWorkflow('one_time_goods', params, orderId)
 *
 * Env:
 *   TEMPORAL_ADDRESS     — Cloud endpoint: djvai.a2dd6.tmprl.cloud:7233
 *   TEMPORAL_NAMESPACE   — Cloud namespace: djvai.a2dd6
 *   TEMPORAL_API_KEY     — Bearer API key from Temporal Cloud console
 *   TEMPORAL_TASK_QUEUE  — Default task queue (default: uce-commerce-financial)
 */
import { appConfig } from "./config";
import { createLogger } from "./logger";
import { WORKFLOW_TASK_QUEUES } from "../temporal/workflows/canonical-workflows";

const logger = createLogger("lib:temporal-client");

let _client: any = null;
let _unavailable = false;

async function loadSDK() {
  try {
    return await import("@temporalio/client");
  } catch {
    return null;
  }
}

export async function getTemporalClient(): Promise<any> {
  if (_client) return _client;
  if (_unavailable) throw new Error("@temporalio/client SDK not installed");

  const cfg = appConfig.temporal;
  if (!cfg.isConfigured) {
    throw new Error(
      "Temporal not configured. Set TEMPORAL_ADDRESS, TEMPORAL_NAMESPACE, and TEMPORAL_API_KEY environment variables.",
    );
  }

  const sdk = await loadSDK();
  if (!sdk) {
    _unavailable = true;
    throw new Error(
      "@temporalio/client SDK not installed. Run: pnpm add @temporalio/client @temporalio/worker @temporalio/workflow --filter backend",
    );
  }

  const { Client, Connection } = sdk;
  const connection = await Connection.connect({
    address: cfg.address, // e.g. djvai.a2dd6.tmprl.cloud:7233
    tls: true, // required for Temporal Cloud
    apiKey: cfg.apiKey, // Bearer API key
  });

  _client = new Client({ connection, namespace: cfg.namespace });
  logger.info(`Temporal client connected: ${cfg.address} ns=${cfg.namespace}`);
  return _client;
}

/**
 * Start a canonical UCE workflow by function name.
 * The function name must match an exported function in canonical-workflows.ts
 *
 * @param workflowFn   Name of the canonical workflow function e.g. "one_time_goods"
 * @param params       Arguments forwarded to the workflow
 * @param workflowId   Idempotency key (e.g. orderId, contractId)
 * @param taskQueueOverride  Override the task queue (optional — auto-resolved from WORKFLOW_TASK_QUEUES)
 */
export async function startCanonicalWorkflow(
  workflowFn: string,
  params: Record<string, unknown>,
  workflowId: string,
  taskQueueOverride?: string,
): Promise<{ workflowId: string; runId: string }> {
  const client = await getTemporalClient();
  const taskQueue =
    taskQueueOverride ??
    WORKFLOW_TASK_QUEUES[workflowFn] ??
    appConfig.temporal.taskQueue;

  const handle = await client.workflow.start(workflowFn, {
    taskQueue,
    workflowId: `${workflowFn}:${workflowId}`,
    args: [params],
  });

  logger.info(
    `Started workflow ${workflowFn} | id=${handle.workflowId} | queue=${taskQueue}`,
  );
  return { workflowId: handle.workflowId, runId: handle.firstExecutionRunId };
}

/**
 * Send a signal to a running workflow
 */
export async function signalWorkflow(
  workflowId: string,
  signalName: string,
  payload?: unknown,
): Promise<void> {
  const client = await getTemporalClient();
  const handle = client.workflow.getHandle(workflowId);
  await handle.signal(signalName, payload);
  logger.info(`Signal ${signalName} sent to workflow ${workflowId}`);
}

/**
 * Health check — returns connection status
 */
export async function checkTemporalHealth(): Promise<{
  connected: boolean;
  error?: string;
}> {
  try {
    await getTemporalClient();
    return { connected: true };
  } catch (err: any) {
    return { connected: false, error: err.message };
  }
}

// Legacy compat: used by old event-dispatcher.ts — routes through startCanonicalWorkflow
export async function startWorkflow(
  workflowId: string,
  input: unknown,
  _nodeContext: unknown,
  taskQueue?: string,
): Promise<{ runId: string }> {
  const result = await startCanonicalWorkflow(
    workflowId,
    input as any,
    workflowId,
    taskQueue,
  );
  return { runId: result.workflowId };
}
