import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { z } from "zod";
import { handleApiError } from "../../../lib/api-error-handler";

const createPaymentTermSchema = z
  .object({
    name: z.string().min(1),
    code: z.string().min(1),
    net_days: z.number().int().min(1).default(30),
    early_payment_discount_percent: z.number().optional(),
    early_payment_discount_days: z.number().int().optional(),
    is_default: z.boolean().default(false),
    is_active: z.boolean().default(true),
    metadata: z.record(z.string(), z.unknown()).nullable().optional(),
  })
  .passthrough();

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const moduleService = req.scope.resolve("company") as any;
    const {
      limit = "20",
      offset = "0",
      is_active,
    } = req.query as Record<string, string | undefined>;
    const filters: Record<string, any> = {};
    if (is_active !== undefined) filters.is_active = is_active === "true";

    // In SDK, the fetch name for PaymentTerms is usually listPaymentTerms
    const items = await moduleService.listPaymentTerms(filters, {
      skip: Number(offset),
      take: Number(limit),
    });

    res.json({
      payment_terms: items,
      count: Array.isArray(items) ? items.length : 0,
    });
  } catch (error: any) {
    handleApiError(res, error, "GET admin payment-terms");
  }
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const moduleService = req.scope.resolve("company") as any;
    const parsed = createPaymentTermSchema.safeParse(req.body);

    if (!parsed.success) {
      return res
        .status(400)
        .json({ message: "Validation failed", errors: parsed.error.issues });
    }

    const item = await moduleService.createPaymentTerms([parsed.data]);
    res.status(201).json({ payment_term: item[0] });
  } catch (error: any) {
    handleApiError(res, error, "POST admin payment-terms");
  }
}
