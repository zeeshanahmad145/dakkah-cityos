/* eslint-disable @typescript-eslint/no-explicit-any */
import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { z } from "zod";
import { handleApiError } from "../../../lib/api-error-handler";

const createCommissionSchema = z
  .object({
    name: z.string(),
    type: z.enum(["percentage", "flat", "tiered", "hybrid"]),
    rate: z.number(),
    vendor_id: z.string().optional(),
    category_id: z.string().optional(),
    priority: z.number().optional().default(0),
    is_active: z.boolean().optional().default(true),
    effective_from: z.string().optional(),
    effective_to: z.string().optional(),
  })
  .strict();

interface CityOSContext {
  tenantId?: string;
  storeId?: string;
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const commissionModule = req.scope.resolve("commission") as unknown as any;
    const cityosContext = req.cityosContext as CityOSContext | undefined;

    const filters: Record<string, unknown> = {};
    if (cityosContext?.tenantId && cityosContext.tenantId !== "default") {
      filters.tenant_id = cityosContext.tenantId;
    }

    const { type, is_active, vendor_id } = req.query as Record<
      string,
      string | undefined
    >;
    if (type) filters.commission_type = type;
    if (is_active !== undefined)
      filters.status = is_active === "true" ? "active" : "inactive";
    if (vendor_id) filters.vendor_id = vendor_id;

    const limit = parseInt(req.query.limit as string) || 20;
    const offset = parseInt(req.query.offset as string) || 0;

    const rules = await commissionModule.listCommissionRules(filters, {
      skip: offset,
      take: limit,
    });

    res.json({
      rules,
      count: Array.isArray(rules) ? rules.length : 0,
      limit,
      offset,
    });
  } catch (error) {
    handleApiError(res, error, "GET admin commissions");
  }
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const parsed = createCommissionSchema.safeParse(req.body);
    if (!parsed.success) {
      return res
        .status(400)
        .json({ message: "Validation failed", errors: parsed.error.issues });
    }

    const commissionModule = req.scope.resolve("commission") as unknown as any;
    const cityosContext = req.cityosContext as CityOSContext | undefined;

    const raw = await commissionModule.createCommissionRules({
      ...parsed.data,
      commission_type: parsed.data.type,
      commission_percentage:
        parsed.data.type === "percentage" ? parsed.data.rate : undefined,
      commission_flat_amount:
        parsed.data.type === "flat" ? parsed.data.rate : undefined,
      status: parsed.data.is_active ? "active" : "inactive",
      tenant_id: cityosContext?.tenantId || "default",
    });
    const rule = Array.isArray(raw) ? raw[0] : raw;
    res.status(201).json({ rule });
  } catch (error) {
    handleApiError(res, error, "POST admin commissions");
  }
}
