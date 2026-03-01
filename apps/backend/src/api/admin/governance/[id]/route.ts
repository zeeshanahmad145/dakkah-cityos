import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { z } from "zod";
import { handleApiError } from "../../../../lib/api-error-handler";

const updateSchema = z
  .object({
    name: z.string().min(1).optional(),
    slug: z.string().optional(),
    code: z.string().nullable().optional(),
    type: z.enum(["region", "country", "authority"]).optional(),
    jurisdiction_level: z.number().optional(),
    parent_authority_id: z.string().nullable().optional(),
    country_id: z.string().nullable().optional(),
    region_id: z.string().nullable().optional(),
    residency_zone: z
      .enum(["GCC", "EU", "MENA", "APAC", "AMERICAS", "GLOBAL"])
      .nullable()
      .optional(),
    policies: z.any().nullable().optional(),
    status: z.enum(["active", "inactive"]).optional(),
    metadata: z.record(z.string(), z.unknown()).nullable().optional(),
  })
  .passthrough();

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const moduleService = req.scope.resolve("governance") as unknown as any;
  const { id } = req.params;
  const [item] = await moduleService.listGovernanceAuthorities(
    { id },
    { take: 1 },
  );
  if (!item) return res.status(404).json({ message: "Not found" });
  return res.json({ item });
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const moduleService = req.scope.resolve("governance") as unknown as any;
  const { id } = req.params;
  const validation = updateSchema.safeParse(req.body);
  if (!validation.success)
    return res
      .status(400)
      .json({ message: "Validation failed", errors: validation.error.issues });
  const item = await moduleService.updateGovernanceAuthorities({
    id,
    ...validation.data,
  });
  return res.json({ item });
}

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  const moduleService = req.scope.resolve("governance") as unknown as any;
  const { id } = req.params;
  await moduleService.deleteGovernanceAuthorities([id]);
  return res.status(204).send();
}
