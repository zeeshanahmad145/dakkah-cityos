import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { z } from "zod";
import { handleApiError } from "../../../../lib/api-error-handler";

const createSchema = z
  .object({
    tenant_id: z.string().optional(),
    customer_id: z.string(),
    plan_id: z.string(),
    status: z.enum(["active", "expired", "suspended", "canceled"]).optional(),
    start_date: z.string().optional(),
    end_date: z.string().optional(),
    auto_renew: z.boolean().optional(),
    metadata: z.record(z.string(), z.unknown()).optional(),
  })
  .passthrough();

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const moduleService = req.scope.resolve("membership") as any;
    const {
      limit = "20",
      offset = "0",
      plan_id,
      status,
      customer_id,
    } = req.query as Record<string, string | undefined>;

    const filters: any = {};
    if (plan_id) filters.plan_id = plan_id;
    if (status) filters.status = status;
    if (customer_id) filters.customer_id = customer_id;

    const items = await moduleService.listMemberships(filters, {
      skip: Number(offset),
      take: Number(limit),
    });
    return res.json({ enrollments: Array.isArray(items) ? items : [] });
  } catch (error: any) {
    handleApiError(res, error, "GET admin memberships enrollments");
  }
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const moduleService = req.scope.resolve("membership") as any;
    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success)
      return res
        .status(400)
        .json({ message: "Validation failed", errors: parsed.error.issues });

    const cityosContext = (req as any).cityosContext as any;
    const tenant_id = cityosContext?.tenantId || "default";

    const item = await moduleService.createMemberships({
      ...parsed.data,
      tenant_id,
    });
    return res.status(201).json({ enrollment: item });
  } catch (error: any) {
    handleApiError(res, error, "POST admin memberships enrollments");
  }
}
