import { appConfig } from "./config"

let client: any = null
let temporalUnavailable = false

async function loadTemporalSDK() {
  try {
    return await import("@temporalio/client")
  } catch {
    return null
  }
}

export async function getTemporalClient(): Promise<any> {
  if (client) return client

  if (temporalUnavailable) {
    throw new Error("Temporal SDK is not installed. Install @temporalio/client to enable Temporal integration.")
  }

  if (!appConfig.temporal.isConfigured) {
    throw new Error("TEMPORAL_API_KEY environment variable is not set")
  }

  const sdk = await loadTemporalSDK()
  if (!sdk) {
    temporalUnavailable = true
    throw new Error("Temporal SDK is not installed. Install @temporalio/client to enable Temporal integration.")
  }

  const { Client, Connection } = sdk

  const connection = await Connection.connect({
    address: appConfig.temporal.endpoint || "ap-northeast-1.aws.api.temporal.io:7233",
    tls: true,
    apiKey: appConfig.temporal.apiKey,
  })

  client = new Client({
    connection,
    namespace: appConfig.temporal.namespace || "quickstart-dakkah-cityos.djvai",
  })

  return client
}

export async function startWorkflow(
  workflowId: string,
  input: any,
  nodeContext: any,
  taskQueue?: string
): Promise<{ runId: string }> {
  const c = await getTemporalClient()
  const handle = await c.workflow.start("cityOSWorkflow", {
    taskQueue: taskQueue || "cityos-workflow-queue",
    workflowId: `${workflowId}-${Date.now()}`,
    args: [
      {
        workflowId,
        input,
        nodeContext,
        correlationId: crypto.randomUUID(),
      },
    ],
  })
  return { runId: handle.workflowId }
}

export async function checkTemporalHealth(): Promise<{
  connected: boolean
  error?: string
}> {
  try {
    await getTemporalClient()
    return { connected: true }
  } catch (err: any) {
    return { connected: false, error: err.message }
  }
}
