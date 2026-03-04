import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { z } from "zod";
import { handleApiError } from "../../../lib/api-error-handler";

const createSchema = z
  .object({
    tenant_id: z.string(),
    customer_id: z.string().optional(),
    name: z.string(),
    email: z.string(),
    affiliate_type: z.enum(["standard", "influencer", "partner", "ambassador"]),
    status: z
      .enum(["pending", "approved", "active", "suspended", "terminated"])
      .optional(),
    commission_rate: z.number(),
    commission_type: z.enum(["percentage", "flat"]).optional(),
    payout_method: z
      .enum(["bank_transfer", "paypal", "store_credit"])
      .optional(),
    payout_minimum: z.number().optional(),
    bio: z.string().optional(),
    social_links: z.any().optional(),
    metadata: z.record(z.string(), z.unknown()).optional(),
  })
  .passthrough();

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const mod = req.scope.resolve("affiliate") as unknown as any;
    const { limit = "20", offset = "0" } = req.query as Record<
      string,
      string | undefined
    >;
    const items = await mod.listAffiliates(
      {},
      { skip: Number(offset), take: Number(limit) },
    );
    return res.json({
      items,
      count: Array.isArray(items) ? items.length : 0,
      limit: Number(limit),
      offset: Number(offset),
    });
  } catch (error: unknown) {
    handleApiError(res, error, "GET admin affiliates");
  }
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const mod = req.scope.resolve("affiliate") as unknown as any;
    const validation = createSchema.safeParse(req.body);
    if (!validation.success)
      return res
        .status(400)
        .json({
          message: "Validation failed",
          errors: validation.error.issues,
        });
    const raw = await mod.createAffiliates(validation.data);
    const item = Array.isArray(raw) ? raw[0] : raw;
    return res.status(201).json({ item });
  } catch (error: unknown) {
    handleApiError(res, error, "POST admin affiliates");
  }
}
