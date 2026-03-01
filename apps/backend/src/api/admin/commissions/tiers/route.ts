import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { z } from "zod";
import { handleApiError } from "../../../../lib/api-error-handler";

const createCommissionTierSchema = z
  .object({
    name: z.string().min(1),
    min_revenue: z.number().min(0),
    max_revenue: z.number().min(0).optional(),
    rate: z.number().min(0).max(100),
  })
  .passthrough();

// GET - List commission tiers
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const query = req.scope.resolve("query") as unknown as any;

    const { data: tiers } = await query.graph({
      entity: "commission_tier",
      fields: [
        "id",
        "name",
        "min_revenue",
        "max_revenue",
        "rate",
        "created_at",
      ],
      filters: {},
    });

    res.json({ tiers });
  } catch (error: unknown) {
    handleApiError(res, error, "GET admin commissions tiers");
  }
}

// POST - Create commission tier
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const parsed = createCommissionTierSchema.safeParse(req.body);
    if (!parsed.success) {
      return res
        .status(400)
        .json({ message: "Validation failed", errors: parsed.error.issues });
    }

    const { name, min_revenue, max_revenue, rate } = parsed.data;

    const commissionService = req.scope.resolve("commissionModuleService") as unknown as any;

    // Check for overlapping tiers
    const query = req.scope.resolve("query") as unknown as any;
    const { data: existingTiers } = await query.graph({
      entity: "commission_tier",
      fields: ["id", "min_revenue", "max_revenue"],
      filters: {},
    });

    for (const tier of existingTiers) {
      const tierMax = tier.max_revenue || Infinity;
      const newMax = max_revenue || Infinity;

      if (
        (min_revenue >= tier.min_revenue && min_revenue < tierMax) ||
        (newMax > tier.min_revenue && newMax <= tierMax) ||
        (min_revenue <= tier.min_revenue && newMax >= tierMax)
      ) {
        return res.status(400).json({
          message: "Revenue range overlaps with existing tier",
        });
      }
    }

    const tier = await commissionService.createCommissionTiers({
      name,
      min_revenue,
      max_revenue,
      rate,
    });

    res.status(201).json({ tier });
  } catch (error: unknown) {
    handleApiError(res, error, "POST admin commissions tiers");
  }
}
