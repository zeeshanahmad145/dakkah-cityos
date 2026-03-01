import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { z } from "zod";
import { handleApiError } from "../../../lib/api-error-handler";

const createSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  insurance_type: z.enum([
    "health",
    "life",
    "auto",
    "home",
    "travel",
    "business",
    "pet",
    "device",
  ]),
  coverage_details: z.any().optional(),
  min_premium: z.number().optional(),
  max_premium: z.number().optional(),
  currency_code: z.string().min(1),
  deductible_options: z.any().optional(),
  term_options: z.any().optional(),
  claim_process: z.string().optional(),
  exclusions: z.any().optional(),
  is_active: z.boolean().optional(),
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

    const mod = req.scope.resolve("financialProduct") as unknown as any;
    const {
      limit = "20",
      offset = "0",
      status,
    } = req.query as Record<string, string | undefined>;

    const filters: Record<string, any> = { provider_id: vendorId };
    if (status) filters.is_active = status === "active";

    const items = await mod.listInsuranceProducts(filters, {
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
    handleApiError(res, error, "GET vendor insurance");
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

    const mod = req.scope.resolve("financialProduct") as unknown as any;
    const validation = createSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        message: "Validation failed",
        errors: validation.error.issues,
      });
    }

    const item = await mod.createInsuranceProducts({
      ...validation.data,
      provider_id: vendorId,
    });

    return res.status(201).json({ item });
  } catch (error: unknown) {
    handleApiError(res, error, "POST vendor insurance");
  }
}
