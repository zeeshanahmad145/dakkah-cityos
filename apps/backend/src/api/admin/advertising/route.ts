import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { z } from "zod";
import { handleApiError } from "../../../lib/api-error-handler";

const createSchema = z
  .object({
    tenant_id: z.string(),
    advertiser_id: z.string(),
    name: z.string(),
    description: z.string().optional(),
    campaign_type: z.enum([
      "sponsored_listing",
      "banner",
      "search",
      "social",
      "email",
    ]),
    status: z
      .enum([
        "draft",
        "pending_review",
        "active",
        "paused",
        "completed",
        "rejected",
      ])
      .optional(),
    budget: z.number(),
    spent: z.number().optional(),
    currency_code: z.string(),
    daily_budget: z.number().optional(),
    bid_type: z.enum(["cpc", "cpm", "cpa", "flat"]).optional(),
    bid_amount: z.number().optional(),
    targeting: z.any().optional(),
    starts_at: z.string().optional(),
    ends_at: z.string().optional(),
    metadata: z.record(z.string(), z.unknown()).optional(),
  })
  .passthrough();

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const mod = req.scope.resolve("advertising") as unknown as any;
    const { limit = "20", offset = "0" } = req.query as Record<
      string,
      string | undefined
    >;
    const items = await mod.listAdCampaigns(
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
    handleApiError(res, error, "GET admin advertising");
  }
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const mod = req.scope.resolve("advertising") as unknown as any;
    const validation = createSchema.safeParse(req.body);
    if (!validation.success)
      return res
        .status(400)
        .json({
          message: "Validation failed",
          errors: validation.error.issues,
        });
    const item = await mod.createAdCampaigns(validation.data);
    return res.status(201).json({ item });
  } catch (error: unknown) {
    handleApiError(res, error, "POST admin advertising");
  }
}
