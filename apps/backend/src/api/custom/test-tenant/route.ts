import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { z } from "zod";
import { handleApiError } from "../../../lib/api-error-handler";

const createTenantSchema = z
  .object({
    name: z.string(),
    slug: z.string().optional(),
    domain: z.string().optional(),
    status: z.string().optional(),
    plan: z.string().optional(),
    owner_email: z.string().optional(),
    owner_name: z.string().optional(),
    trial_ends_at: z.string().optional(),
    metadata: z.record(z.string(), z.unknown()).optional(),
  })
  .passthrough();

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const tenantModuleService = req.scope.resolve("tenantModuleService") as unknown as any;

    const {
      limit = 20,
      offset = 0,
      status,
    } = req.query as {
      limit?: number;
      offset?: number;
      status?: string;
    };

    const filters: Record<string, any> = {};
    if (status) filters.status = status;

    const [tenants, count] = await tenantModuleService.listAndCountTenants(
      filters,
      {
        skip: Number(offset),
        take: Number(limit),
      },
    );

    res.json({
      tenants,
      count,
      offset: Number(offset),
      limit: Number(limit),
    });
  } catch (error: unknown) {
    handleApiError(res, error, "GET admin tenants");
  }
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const tenantModuleService = req.scope.resolve("tenantModuleService") as unknown as any;
    const parsed = createTenantSchema.safeParse(req.body);
    if (!parsed.success) {
      return res
        .status(400)
        .json({ message: "Validation failed", errors: parsed.error.issues });
    }

    const tenant = await tenantModuleService.createTenants(parsed.data);

    res.status(201).json({ tenant });
  } catch (error: unknown) {
    handleApiError(res, error, "POST admin tenants");
  }
}
