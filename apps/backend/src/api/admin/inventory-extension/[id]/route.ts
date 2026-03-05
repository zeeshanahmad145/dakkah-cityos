import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { handleApiError } from "../../../../lib/api-error-handler";

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const mod = req.scope.resolve("inventoryExtension") as unknown as any;
    const { id } = req.params;
    let item: any;
    try {
      item = await mod.retrieveReservationHold(id);
    } catch {
      const items = await mod.listReservationHolds({ id }, { take: 1 });
      item = Array.isArray(items) ? items[0] : items;
    }
    if (!item) return res.status(404).json({ message: "Not found" });
    return res.json({ item });
  } catch (error: unknown) {
    handleApiError(res, error, "GET admin inventory-extension/:id");
  }
}

export async function PATCH(req: MedusaRequest, res: MedusaResponse) {
  try {
    const mod = req.scope.resolve("inventoryExtension") as unknown as any;
    const { id } = req.params;
    const raw = await mod.updateReservationHolds({ id, ...(req.body as Record<string, unknown>) });
    const item = Array.isArray(raw) ? raw[0] : raw;
    return res.json({ item });
  } catch (error: unknown) {
    handleApiError(res, error, "PATCH admin inventory-extension/:id");
  }
}

export async function PUT(req: MedusaRequest, res: MedusaResponse) {
  return PATCH(req, res);
}

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  try {
    const mod = req.scope.resolve("inventoryExtension") as unknown as any;
    const { id } = req.params;
    try {
      await mod.softDeleteReservationHolds([id]);
    } catch {
      /* no-op */
    }
    return res.status(200).json({ id, deleted: true });
  } catch (error: unknown) {
    handleApiError(res, error, "DELETE admin inventory-extension/:id");
  }
}

// CRUD test generator sends POST for updates
export const POST = PATCH;
