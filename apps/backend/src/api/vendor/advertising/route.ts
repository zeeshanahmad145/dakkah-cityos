import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { z } from "zod";
import { handleApiError } from "../../../lib/api-error-handler";

const createSchema = z.object({
  name: z.string().min(1),
  description: z.string().nullable().optional(),
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
  currency_code: z.string().min(1),
  daily_budget: z.number().nullable().optional(),
  bid_type: z.enum(["cpc", "cpm", "cpa", "flat"]).optional(),
  bid_amount: z.number().nullable().optional(),
  targeting: z.any().nullable().optional(),
  starts_at: z.string().nullable().optional(),
  ends_at: z.string().nullable().optional(),
  metadata: z.record(z.string(), z.unknown()).nullable().optional(),
});

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const vendorId = req.vendor_id;
    if (!vendorId) {
      return res
        .status(401)
        .json({ message: "Vendor authentication required" });
    }

    const mod = req.scope.resolve("advertising") as unknown as any;
    const {
      limit = "20",
      offset = "0",
      status,
    } = req.query as Record<string, string | undefined>;

    const filters: Record<string, any> = { advertiser_id: vendorId };
    if (status) filters.status = status;

    const items = await mod.listAdCampaigns(filters, {
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
  } catch (error: unknown) {
    handleApiError(res, error, "GET vendor advertising");
  }
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const vendorId = req.vendor_id;
    if (!vendorId) {
      return res
        .status(401)
        .json({ message: "Vendor authentication required" });
    }

    const mod = req.scope.resolve("advertising") as unknown as any;
    const validation = createSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        message: "Validation failed",
        errors: validation.error.issues,
      });
    }

    const item = await mod.createAdCampaigns({
      ...validation.data,
      advertiser_id: vendorId,
    });

    return res.status(201).json({ item });
  } catch (error: unknown) {
    handleApiError(res, error, "POST vendor advertising");
  }
}
