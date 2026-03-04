import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { z } from "zod";
import { handleApiError } from "../../../lib/api-error-handler";

const createSchema = z.object({
  customer_id: z.string(),
  product_id: z.string().optional(),
  type: z
    .enum(["product", "travel", "health", "vehicle", "home", "life", "other"])
    .default("product"),
  coverage_amount: z.number().positive(),
  premium_amount: z.number().positive(),
  currency: z.string().default("usd"),
  starts_at: z.string(),
  expires_at: z.string(),
  coverage_details: z.record(z.string(), z.unknown()).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const mod = req.scope.resolve("insurance") as unknown as any;
    const {
      limit = "20",
      offset = "0",
      status,
    } = req.query as Record<string, string | undefined>;
    const filters: Record<string, unknown> = {};
    if (status) filters.status = status;
    const items = await mod.listInsurancePolicies(filters, {
      skip: Number(offset),
      take: Number(limit),
      order: { created_at: "DESC" },
    });
    const count = await mod.countInsurancePolicies(filters);
    return res.json({
      items: Array.isArray(items) ? items : [],
      count,
      limit: Number(limit),
      offset: Number(offset),
    });
  } catch (error: unknown) {
    handleApiError(res, error, "GET admin insurance");
  }
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const mod = req.scope.resolve("insurance") as unknown as any;
    const validation = createSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        message: "Validation failed",
        errors: validation.error.issues,
      });
    }
    const data = validation.data;
    const raw = await mod.createPolicy({
      customerId: data.customer_id,
      productId: data.product_id,
      planType: data.type,
      coverageAmount: data.coverage_amount,
      premium: data.premium_amount,
      startDate: new Date(data.starts_at),
      metadata: data.metadata,
    });
    const item = Array.isArray(raw) ? raw[0] : raw;
    return res.status(201).json({ item });
  } catch (error: unknown) {
    handleApiError(res, error, "POST admin insurance");
  }
}
