import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { z } from "zod";
import { handleApiError } from "../../../../lib/api-error-handler";

const createSchema = z
  .object({
    name: z.string(),
    description: z.string().optional(),
    price: z.number(),
    currency_code: z.string(),
    duration_days: z.number(),
    benefits: z.array(z.string()).optional(),
    max_members: z.number().optional(),
    is_active: z.boolean().optional(),
    metadata: z.record(z.string(), z.unknown()).optional(),
  })
  .passthrough();

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const moduleService = req.scope.resolve("membership") as unknown as any;
    const {
      limit = "20",
      offset = "0",
      is_active,
    } = req.query as Record<string, string | undefined>;

    const filters: Record<string, unknown> = {};
    if (is_active !== undefined) {
      filters.is_active = is_active === "true";
    }

    const items = await moduleService.listMemberships(filters, {
      skip: Number(offset),
      take: Number(limit),
    });
    return res.json({ plans: Array.isArray(items) ? items : [] });
  } catch (error: unknown) {
    handleApiError(res, error, "GET admin memberships plans");
  }
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const moduleService = req.scope.resolve("membership") as unknown as any;
    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success)
      return res
        .status(400)
        .json({ message: "Validation failed", errors: parsed.error.issues });

    const item = await moduleService.createMemberships(parsed.data);
    return res.status(201).json({ plan: item });
  } catch (error: unknown) {
    handleApiError(res, error, "POST admin memberships plans");
  }
}
