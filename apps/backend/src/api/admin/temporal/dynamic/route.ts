import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "zod"
import { handleApiError } from "../../../../lib/api-error-handler"
import {
  startDynamicWorkflow,
  listDynamicWorkflows,
} from "../../../../lib/dynamic-workflow-client"

const StartDynamicWorkflowSchema = z.object({
  goal: z.string().min(1, "goal is required"),
  context: z.record(z.string(), z.any()).optional().default({}),
  tools: z.array(z.string()).optional().default([]),
  maxIterations: z.number().int().positive().optional(),
  nodeContext: z
    .object({
      tenantId: z.string().optional(),
      nodeId: z.string().optional(),
      channel: z.string().optional(),
      locale: z.string().optional(),
    })
    .optional(),
}).passthrough()

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const status = (req.query.status as string) || undefined
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10

    const workflows = await listDynamicWorkflows({ status, limit })

    return res.json({
      workflows,
      count: workflows.length,
    })
  } catch (error: any) {
    return handleApiError(res, error, "ADMIN-TEMPORAL-DYNAMIC")
  }
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const parsed = StartDynamicWorkflowSchema.safeParse(req.body)

    if (!parsed.success) {
      return res.status(400).json({
        error: "Validation failed",
        details: parsed.error.flatten().fieldErrors,
      })
    }

    const { goal, context, tools, maxIterations, nodeContext } = parsed.data

    const result = await startDynamicWorkflow({
      goal,
      context: context!,
      availableTools: tools!,
      maxIterations,
      nodeContext,
    })

    return res.status(201).json(result)
  } catch (error: any) {
    return handleApiError(res, error, "ADMIN-TEMPORAL-DYNAMIC")
  }
}

