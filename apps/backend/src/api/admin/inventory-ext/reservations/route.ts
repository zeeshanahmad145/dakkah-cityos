import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { handleApiError } from "../../../../lib/api-error-handler";

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const service = req.scope.resolve("inventoryExtension") as unknown as any;
    const filters: Record<string, any> = {};
    if (req.query.status) filters.status = req.query.status;
    if (req.query.product_id) filters.product_id = req.query.product_id;
    const reservations = await service.listReservationHolds(filters);
    res.json({
      reservations: Array.isArray(reservations)
        ? reservations
        : [reservations].filter(Boolean),
    });
  } catch (error: unknown) {
    return handleApiError(res, error, "ADMIN-INVENTORY-EXT-RESERVATIONS");
  }
}
