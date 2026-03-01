import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { z } from "zod";
import { handleApiError } from "../../../../../lib/api-error-handler";

const updateCommissionTierSchema = z
  .object({
    name: z.string().min(1).optional(),
    min_revenue: z.number().min(0).optional(),
    max_revenue: z.number().min(0).optional(),
    rate: z.number().min(0).max(100).optional(),
  })
  .passthrough();

// GET - Get commission tier by ID
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const { id } = req.params;
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
        "updated_at",
      ],
      filters: { id },
    });

    if (!tiers.length) {
      return res.status(404).json({ message: "Commission tier not found" });
    }

    res.json({ tier: tiers[0] });
  } catch (error: unknown) {
    handleApiError(res, error, "GET admin commissions tiers id");
  }
}

// PUT - Update commission tier
export async function PUT(req: MedusaRequest, res: MedusaResponse) {
  try {
    const { id } = req.params;
    const parsed = updateCommissionTierSchema.safeParse(req.body);
    if (!parsed.success) {
      return res
        .status(400)
        .json({ message: "Validation failed", errors: parsed.error.issues });
    }

    const { name, min_revenue, max_revenue, rate } = parsed.data;

    const commissionService = req.scope.resolve("commissionModuleService") as unknown as any;

    await commissionService.updateCommissionTiers({
      selector: { id },
      data: {
        ...(name && { name }),
        ...(min_revenue !== undefined && { min_revenue }),
        ...(max_revenue !== undefined && { max_revenue }),
        ...(rate !== undefined && { rate }),
      },
    });

    const query = req.scope.resolve("query") as unknown as any;
    const { data: tiers } = await query.graph({
      entity: "commission_tier",
      fields: ["id", "name", "min_revenue", "max_revenue", "rate"],
      filters: { id },
    });

    res.json({ tier: tiers[0] });
  } catch (error: unknown) {
    handleApiError(res, error, "PUT admin commissions tiers id");
  }
}

// DELETE - Delete commission tier
export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  try {
    const { id } = req.params;
    const commissionService = req.scope.resolve("commissionModuleService") as unknown as any;

    await commissionService.deleteCommissionTiers(id);

    res.json({ message: "Commission tier deleted", id });
  } catch (error: unknown) {
    handleApiError(res, error, "DELETE admin commissions tiers id");
  }
}
