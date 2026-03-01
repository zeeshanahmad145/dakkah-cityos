import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { z } from "zod";
import { handleApiError } from "../../../../lib/api-error-handler";

const updateSchema = z
  .object({
    facility_id: z.string().optional(),
    membership_type: z
      .enum(["basic", "premium", "vip", "student", "corporate", "family"])
      .optional(),
    status: z.enum(["active", "frozen", "expired", "cancelled"]).optional(),
    start_date: z.string().optional(),
    end_date: z.string().optional(),
    monthly_fee: z.number().optional(),
    currency_code: z.string().optional(),
    auto_renew: z.boolean().optional(),
    freeze_count: z.number().optional(),
    max_freezes: z.number().optional(),
    access_hours: z.any().optional(),
    includes: z.any().optional(),
    metadata: z.record(z.string(), z.unknown()).optional(),
  })
  .passthrough();

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const mod = req.scope.resolve("fitness") as unknown as any;
    const { id } = req.params;
    const [item] = await mod.listGymMemberships({ id }, { take: 1 });
    if (!item) return res.status(404).json({ message: "Not found" });
    return res.json({ item });
  } catch (error: unknown) {
    handleApiError(res, error, "GET admin fitness id");
  }
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const mod = req.scope.resolve("fitness") as unknown as any;
    const { id } = req.params;
    const validation = updateSchema.safeParse(req.body);
    if (!validation.success)
      return res
        .status(400)
        .json({
          message: "Validation failed",
          errors: validation.error.issues,
        });
    const item = await mod.updateGymMemberships({ id, ...validation.data });
    return res.json({ item });
  } catch (error: unknown) {
    handleApiError(res, error, "POST admin fitness id");
  }
}

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  try {
    const mod = req.scope.resolve("fitness") as unknown as any;
    const { id } = req.params;
    await mod.deleteGymMemberships([id]);
    return res.status(204).send();
  } catch (error: unknown) {
    handleApiError(res, error, "DELETE admin fitness id");
  }
}
