import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { z } from "zod";
import { handleApiError } from "../../../lib/api-error-handler";

const createSchema = z.object({
  order_id: z.string().min(1),
  reason: z.enum([
    "product_not_received",
    "product_damaged",
    "wrong_item",
    "quality_issue",
    "refund_request",
    "other",
  ]),
  description: z.string().min(1),
  evidence: z.any().nullable().optional(),
  metadata: z.record(z.string(), z.unknown()).nullable().optional(),
});

const updateSchema = z.object({
  vendor_response: z.string().optional(),
  vendor_evidence: z.any().nullable().optional(),
  proposed_resolution: z
    .enum(["full_refund", "partial_refund", "replacement", "repair", "reject"])
    .optional(),
  proposed_amount: z.number().nullable().optional(),
  status: z
    .enum(["pending", "vendor_responded", "escalated", "resolved", "closed"])
    .optional(),
  metadata: z.record(z.string(), z.unknown()).nullable().optional(),
});

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const vendorId = req.vendor_id;
  if (!vendorId) {
    return res.status(401).json({ message: "Vendor authentication required" });
  }

  const mod = req.scope.resolve("dispute") as unknown as any;
  const {
    limit = "20",
    offset = "0",
    status,
    reason,
  } = req.query as Record<string, string | undefined>;

  const filters: Record<string, any> = { vendor_id: vendorId };
  if (status) filters.status = status;
  if (reason) filters.reason = reason;

  const items = await mod.listDisputes(filters, {
    skip: Number(offset),
    take: Number(limit),
    order: { created_at: "DESC" },
  });

  return res.json({
    items,
    count: Array.isArray(items) ? items.length : 0,
    limit: Number(limit),
    offset: Number(offset),
  });
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const vendorId = req.vendor_id;
  if (!vendorId) {
    return res.status(401).json({ message: "Vendor authentication required" });
  }

  const mod = req.scope.resolve("dispute") as unknown as any;
  const body = req.body as Record<string, unknown>;
  const validation = updateSchema.safeParse(body);
  if (!validation.success) {
    return res
      .status(400)
      .json({ message: "Validation failed", errors: validation.error.issues });
  }

  const disputeId = req.query.id;
  if (!disputeId) {
    return res.status(400).json({ message: "Dispute ID required" });
  }

  try {
    const existing = await mod.retrieveDispute(disputeId);
    if (!existing || existing.vendor_id !== vendorId) {
      return res
        .status(403)
        .json({ message: "Not authorized to update this dispute" });
    }
  } catch {
    return res.status(404).json({ message: "Dispute not found" });
  }

  const item = await mod.updateDisputes(disputeId, {
    ...validation.data,
    vendor_id: vendorId,
  });

  return res.json({ item });
}
