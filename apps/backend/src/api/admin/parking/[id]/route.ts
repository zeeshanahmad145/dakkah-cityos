import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { z } from "zod";
import { handleApiError } from "../../../../lib/api-error-handler";

const updateSchema = z
  .object({
    name: z.string().optional(),
    description: z.string().optional(),
    zone_type: z
      .enum(["street", "garage", "lot", "valet", "airport", "reserved"])
      .optional(),
    address: z.any().optional(),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
    total_spots: z.number().optional(),
    available_spots: z.number().optional(),
    hourly_rate: z.number().optional(),
    daily_rate: z.number().optional(),
    monthly_rate: z.number().optional(),
    currency_code: z.string().optional(),
    operating_hours: z.any().optional(),
    is_active: z.boolean().optional(),
    has_ev_charging: z.boolean().optional(),
    has_disabled_spots: z.boolean().optional(),
    metadata: z.record(z.string(), z.unknown()).optional(),
  })
  .passthrough();

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const mod = req.scope.resolve("parking") as unknown as any;
    const { id } = req.params;
    const [item] = await mod.listParkingZones({ id }, { take: 1 });
    if (!item) return res.status(404).json({ message: "Not found" });
    return res.json({ item });
  } catch (error: unknown) {
    handleApiError(res, error, "GET admin parking id");
  }
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const mod = req.scope.resolve("parking") as unknown as any;
    const { id } = req.params;
    const parsed = updateSchema.safeParse(req.body);
    if (!parsed.success)
      return res
        .status(400)
        .json({ message: "Validation failed", errors: parsed.error.issues });
    const item = await mod.updateParkingZones({ id, ...parsed.data });
    return res.json({ item });
  } catch (error: unknown) {
    handleApiError(res, error, "POST admin parking id");
  }
}

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  try {
    const mod = req.scope.resolve("parking") as unknown as any;
    const { id } = req.params;
    await mod.deleteParkingZones([id]);
    return res.status(204).send();
  } catch (error: unknown) {
    handleApiError(res, error, "DELETE admin parking id");
  }
}
