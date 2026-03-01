import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { z } from "zod";
import { handleApiError } from "../../../../lib/api-error-handler";

const updateSchema = z
  .object({
    residency_zone: z
      .enum(["GCC", "EU", "MENA", "APAC", "AMERICAS", "GLOBAL"])
      .optional(),
    medusa_region_id: z.string().optional(),
    country_codes: z.any().optional(),
    policies_override: z.any().optional(),
    metadata: z.record(z.string(), z.unknown()).optional(),
  })
  .passthrough();

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const mod = req.scope.resolve("regionZone") as unknown as any;
  const { id } = req.params;
  const [item] = await mod.listRegionZoneMappings({ id }, { take: 1 });
  if (!item) return res.status(404).json({ message: "Not found" });
  return res.json({ item });
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const mod = req.scope.resolve("regionZone") as unknown as any;
  const { id } = req.params;
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success)
    return res
      .status(400)
      .json({ message: "Validation failed", errors: parsed.error.issues });
  const item = await mod.updateRegionZoneMappings({ id, ...parsed.data });
  return res.json({ item });
}

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  const mod = req.scope.resolve("regionZone") as unknown as any;
  const { id } = req.params;
  await mod.deleteRegionZoneMappings([id]);
  return res.status(204).send();
}
