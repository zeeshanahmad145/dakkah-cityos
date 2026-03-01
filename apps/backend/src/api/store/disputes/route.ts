import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { z } from "zod";
import { handleApiError } from "../../../lib/api-error-handler";

const createDisputeSchema = z.object({
  order_id: z.string().min(1, "Order ID is required"),
  reason: z.string().min(1, "Reason is required"),
  description: z.string().min(1, "Description is required"),
  type: z.string().default("general"),
  priority: z.string().default("medium"),
  attachments: z.array(z.any()).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const disputeService = req.scope.resolve("dispute") as unknown as any;
    const customerId = req.auth_context?.actor_id;

    if (!customerId) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const {
      status,
      limit = "20",
      offset = "0",
    } = req.query as Record<string, string | undefined>;

    const disputes = await disputeService.getByCustomer(customerId, {
      status,
      limit: Number(limit),
      offset: Number(offset),
    });

    const items = Array.isArray(disputes)
      ? disputes
      : [disputes].filter(Boolean);

    return res.json({
      items,
      count: items.length,
      limit: Number(limit),
      offset: Number(offset),
    });
  } catch (error: unknown) {
    handleApiError(res, error, "STORE-DISPUTES");
  }
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const disputeService = req.scope.resolve("dispute") as unknown as any;
    const customerId = req.auth_context?.actor_id;

    if (!customerId) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const parsed = createDisputeSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        message: "Validation failed",
        errors: parsed.error.issues,
      });
    }

    const {
      order_id,
      reason,
      description,
      type,
      priority,
      attachments,
      metadata,
    } = parsed.data;

    const dispute = await disputeService.openDispute({
      orderId: order_id,
      customerId,
      tenantId: req.auth_context?.tenant_id || "default",
      type: type || "general",
      priority: priority || "medium",
      description: `${reason}: ${description}`,
      attachments,
      metadata,
    });

    res.status(201).json({ dispute });
  } catch (error: unknown) {
    return handleApiError(res, error, "STORE-DISPUTES");
  }
}
