import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { startWorkflow } from "../../../../lib/temporal-client"
import { getWorkflowForEvent } from "../../../../lib/event-dispatcher"
import { z } from "zod"
import { handleApiError } from "../../../../lib/api-error-handler"

const triggerSchema = z.object({
  workflowId: z.string().min(1),
  input: z.record(z.string(), z.unknown()).optional(),
  nodeContext: z.record(z.string(), z.unknown()).optional(),
  eventType: z.string().optional(),
}).passthrough()

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const parsed = triggerSchema.safeParse(req.body)

  if (!parsed.success) {
    return res.status(400).json({
      message: "Validation failed",
      errors: parsed.error.issues,
    })
  }

  const { workflowId, input, nodeContext, eventType } = parsed.data

  const mapping = eventType ? getWorkflowForEvent(eventType) : null
  const resolvedWorkflowId = mapping ? mapping.workflowId : workflowId
  const resolvedTaskQueue = mapping ? mapping.taskQueue : undefined

  try {
    const result = await startWorkflow(resolvedWorkflowId, input, nodeContext, resolvedTaskQueue)
    return res.status(201).json({
      message: "Workflow triggered successfully",
      workflowId: resolvedWorkflowId,
      runId: result.runId,
    })
  } catch (error: any) {
    return handleApiError(res, error, "ADMIN-TEMPORAL-TRIGGER")
  }
}

