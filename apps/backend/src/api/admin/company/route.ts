import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { z } from "zod";
import { handleApiError } from "../../../lib/api-error-handler";

const createSchema = z
  .object({
    name: z.string().min(1),
    legal_name: z.string().optional(),
    registration_number: z.string().optional(),
    type: z.string().optional(),
    industry: z.string().optional(),
    email: z.string().email(),
    phone: z.string().optional(),
    tax_id: z.string().optional(),
    customer_id: z.string(),
    store_id: z.string().optional(),
    credit_limit: z.string().optional(),
    payment_terms_days: z.number().optional(),
    tier: z.enum(["bronze", "silver", "gold", "platinum"]).optional(),
    status: z.enum(["active", "pending", "suspended", "inactive"]).optional(),
    metadata: z.record(z.string(), z.unknown()).optional(),
  })
  .passthrough();

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const mod = req.scope.resolve("company") as unknown as any;
  const {
    limit = "20",
    offset = "0",
    status,
    industry,
  } = req.query as Record<string, string | undefined>;
  const filters: Record<string, any> = {};
  if (status) filters.status = status;
  if (industry) filters.industry = industry;
  const items = await mod.listCompanies(filters, {
    skip: Number(offset),
    take: Number(limit),
  });
  const list = Array.isArray(items)
    ? items
    : Array.isArray(items?.[0])
      ? items[0]
      : [items].filter(Boolean);
  return res.json({
    items: list,
    count: list.length,
    limit: Number(limit),
    offset: Number(offset),
  });
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const mod = req.scope.resolve("company") as unknown as any;
  const validation = createSchema.safeParse(req.body);
  if (!validation.success)
    return res
      .status(400)
      .json({ message: "Validation failed", errors: validation.error.issues });
  const item = await mod.createCompanies(validation.data);
  return res.status(201).json({ item });
}
