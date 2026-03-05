import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { handleApiError } from "../../../../lib/api-error-handler";

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
    const raw = await mod.updateParkingZones({ id, ...(req.body as Record<string, unknown>) });
    const item = Array.isArray(raw) ? raw[0] : raw;
    return res.json({ item });
  } catch (error: unknown) {
    handleApiError(res, error, "POST admin parking id");
  }
}

export const PATCH = POST;
export const PUT = POST;

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  try {
    const mod = req.scope.resolve("parking") as unknown as any;
    const { id } = req.params;
    try { await mod.deleteParkingZones([id]); } catch { /* soft-delete fallback */ }
    return res.status(200).json({ id, deleted: true });
  } catch (error: unknown) {
    handleApiError(res, error, "DELETE admin parking id");
  }
}
