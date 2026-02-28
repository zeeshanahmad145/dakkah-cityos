import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { z } from "zod";
import { handleApiError } from "../../../lib/api-error-handler";

const createSchema = z
  .object({
    title: z.string(),
    description: z.string().optional(),
    product_id: z.string().optional(),
    customer_id: z.string(),
    condition: z.enum(["excellent", "good", "fair", "poor"]),
    estimated_value: z.number(),
    offered_value: z.number().optional(),
    status: z
      .enum(["pending", "appraised", "accepted", "rejected", "completed"])
      .optional(),
    tenant_id: z.string(),
    metadata: z.record(z.string(), z.unknown()).optional(),
  })
  .passthrough();

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const mod = req.scope.resolve("tradeInModule") as any;
    const { limit = "20", offset = "0" } = req.query as Record<
      string,
      string | undefined
    >;
    const items = await mod.listTradeIns(
      {},
      { skip: Number(offset), take: Number(limit) },
    );
    return res.json({
      items,
      count: Array.isArray(items) ? items.length : 0,
      limit: Number(limit),
      offset: Number(offset),
    });
  } catch (error: any) {
    handleApiError(res, error, "GET admin trade-ins");
  }
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const mod = req.scope.resolve("tradeInModule") as any;
    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success)
      return res
        .status(400)
        .json({ message: "Validation failed", errors: parsed.error.issues });
    const item = await mod.createTradeIns(parsed.data);
    return res.status(201).json({ item });
  } catch (error: any) {
    handleApiError(res, error, "POST admin trade-ins");
  }
}
