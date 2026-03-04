import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { z } from "zod";
import { handleApiError } from "../../../lib/api-error-handler";

const createSchema = z
  .object({
    tenant_id: z.string(),
    is_active: z.boolean().optional(),
    expires_at: z.string().optional(),
    initial_value: z.number(),
    remaining_value: z.number().optional(),
    metadata: z.record(z.string(), z.unknown()).optional(),
  })
  .passthrough();

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const mod = req.scope.resolve("promotionExt") as unknown as any;
    const { limit = "20", offset = "0" } = req.query as Record<
      string,
      string | undefined
    >;
    const items = await mod.listGiftCardExts(
      {},
      { skip: Number(offset), take: Number(limit) },
    );
    return res.json({
      items: Array.isArray(items) ? items : [items],
      count: Array.isArray(items) ? items.length : 0,
      limit: Number(limit),
      offset: Number(offset),
    });
  } catch (error: unknown) {
    handleApiError(res, error, "GET admin flash-deals");
  }
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const mod = req.scope.resolve("promotionExt") as unknown as any;
    const validation = createSchema.safeParse(req.body);
    if (!validation.success)
      return res.status(400).json({
        message: "Validation failed",
        errors: validation.error.issues,
      });
    const raw = await mod.createGiftCardExts(validation.data);
    const item = Array.isArray(raw) ? raw[0] : raw;
    return res.status(201).json({ item });
  } catch (error: unknown) {
    handleApiError(res, error, "POST admin flash-deals");
  }
}
