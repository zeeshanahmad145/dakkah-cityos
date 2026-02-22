import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "zod"
import { handleApiError } from "../../../../../lib/api-error-handler"
import {
  queryDynamicWorkflowStatus,
  signalDynamicWorkflow,
  cancelDynamicWorkflow,
} from "../../../../../lib/dynamic-workflow-client"

const SignalWorkflowSchema = z.object({
  signal: z.string().min(1, "signal name is required"),
  data: z.any().optional(),
}).passthrough()

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const { workflowId } = req.params

  try {
    const status = await queryDynamicWorkflowStatus(workflowId)
    return res.json(status)
  } catch (error: any) {
    return handleApiError(res, error, "ADMIN-TEMPORAL-DYNAMIC-WORKFLOWID")
  }
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const { workflowId } = req.params

  try {
    const parsed = SignalWorkflowSchema.safeParse(req.body)

    if (!parsed.success) {
      return res.status(400).json({
        error: "Validation failed",
        details: parsed.error.flatten().fieldErrors,
      })
    }

    const { signal, data } = parsed.data

    await signalDynamicWorkflow(workflowId, signal, data)

    return res.json({
      success: true,
      workflowId,
      signal,
    })
  } catch (error: any) {
    return handleApiError(res, error, "ADMIN-TEMPORAL-DYNAMIC-WORKFLOWID")
  }
}

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  const { workflowId } = req.params

  try {
    await cancelDynamicWorkflow(workflowId)

    return res.json({
      success: true,
      workflowId,
      message: "Workflow cancellation requested",
    })
  } catch (error: any) {
    return handleApiError(res, error, "ADMIN-TEMPORAL-DYNAMIC-WORKFLOWID")
  }
}

