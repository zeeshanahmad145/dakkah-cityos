import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { startCanonicalWorkflow } from "../../../../lib/temporal-client";
import { getWorkflowForEvent } from "../../../../lib/event-dispatcher";
import { z } from "zod";
import { handleApiError } from "../../../../lib/api-error-handler";

const triggerSchema = z
  .object({
    workflowFn: z.string().min(1),
    input: z.record(z.string(), z.unknown()).optional(),
    nodeContext: z.record(z.string(), z.unknown()).optional(),
    eventType: z.string().optional(),
  })
  .passthrough();

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const parsed = triggerSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      message: "Validation failed",
      errors: parsed.error.issues,
    });
  }

  const { workflowFn, input, nodeContext, eventType } = parsed.data;

  const mapping = eventType ? getWorkflowForEvent(eventType) : null;
  const resolvedFn = mapping ? mapping.workflowFn : workflowFn;
  const resolvedTaskQueue = mapping ? mapping.taskQueue : undefined;
  const idempotencyKey = (input as any)?.id || `manual:${Date.now()}`;

  try {
    const result = await startCanonicalWorkflow(
      resolvedFn,
      (input ?? {}) as Record<string, unknown>,
      idempotencyKey,
      resolvedTaskQueue,
    );
    return res.status(201).json({
      message: "Workflow triggered successfully",
      workflowFn: resolvedFn,
      workflowId: result.workflowId,
      runId: result.runId,
    });
  } catch (error: unknown) {
    return handleApiError(res, error, "ADMIN-TEMPORAL-TRIGGER");
  }
}
