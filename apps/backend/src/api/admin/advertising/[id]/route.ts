import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { z } from "zod";
import { handleApiError } from "../../../../lib/api-error-handler";

const updateSchema = z
  .object({
    name: z.string().optional(),
    description: z.string().optional(),
    campaign_type: z
      .enum(["sponsored_listing", "banner", "search", "social", "email"])
      .optional(),
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
    budget: z.number().optional(),
    currency_code: z.string().optional(),
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
    const { id } = req.params;
    const [item] = await mod.listAdCampaigns({ id }, { take: 1 });
    if (!item) return res.status(404).json({ message: "Not found" });
    return res.json({ item });
  } catch (error: unknown) {
    handleApiError(res, error, "GET admin advertising id");
  }
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const mod = req.scope.resolve("advertising") as unknown as any;
    const { id } = req.params;
    const validation = updateSchema.safeParse(req.body);
    if (!validation.success)
      return res
        .status(400)
        .json({
          message: "Validation failed",
          errors: validation.error.issues,
        });
    const item = await mod.updateAdCampaigns({ id, ...validation.data });
    return res.json({ item });
  } catch (error: unknown) {
    handleApiError(res, error, "POST admin advertising id");
  }
}

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  try {
    const mod = req.scope.resolve("advertising") as unknown as any;
    const { id } = req.params;
    await mod.deleteAdCampaigns([id]);
    return res.status(204).send();
  } catch (error: unknown) {
    handleApiError(res, error, "DELETE admin advertising id");
  }
}
