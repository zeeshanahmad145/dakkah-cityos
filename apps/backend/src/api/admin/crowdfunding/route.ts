import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { z } from "zod";
import { handleApiError } from "../../../lib/api-error-handler";

const createSchema = z
  .object({
    tenant_id: z.string().optional(),
    creator_id: z.string().optional(),
    title: z.string(),
    description: z.string(),
    short_description: z.string().optional(),
    campaign_type: z.enum(["reward", "equity", "donation", "debt"]),
    status: z
      .enum([
        "draft",
        "pending_review",
        "active",
        "funded",
        "failed",
        "cancelled",
      ])
      .optional(),
    goal_amount: z.number(),
    currency_code: z.string(),
    starts_at: z.string().optional(),
    ends_at: z.string(),
    is_flexible_funding: z.boolean().optional(),
    category: z.string().optional(),
    images: z.any().optional(),
    video_url: z.string().optional(),
    risks_and_challenges: z.string().optional(),
    metadata: z.record(z.string(), z.unknown()).optional(),
  })
  .passthrough();

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const mod = req.scope.resolve("crowdfunding") as unknown as any;
    const { limit = "20", offset = "0" } = req.query as Record<
      string,
      string | undefined
    >;
    const items = await mod.listCrowdfundCampaigns(
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
    handleApiError(res, error, "GET admin crowdfunding");
  }
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const mod = req.scope.resolve("crowdfunding") as unknown as any;
    const validation = createSchema.safeParse(req.body);
    if (!validation.success)
      return res.status(400).json({
        message: "Validation failed",
        errors: validation.error.issues,
      });

    const cityosContext = req.cityosContext;
    const tenant_id = cityosContext?.tenantId || "default";
    const creator_id = validation.data.creator_id || "admin";

    const raw = await mod.createCrowdfundCampaigns({
      ...validation.data,
      tenant_id,
      creator_id,
    });
    const item = Array.isArray(raw) ? raw[0] : raw;
    return res.status(201).json({ item });
  } catch (error: unknown) {
    handleApiError(res, error, "POST admin crowdfunding");
  }
}
