import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { handleApiError } from "../../../../../lib/api-error-handler";

/**
 * GET /store/grocery/delivery-slots
 * List available delivery slots for a zone and date.
 *
 * POST /store/grocery/delivery-slots/:id/book
 * Book a delivery slot for an order.
 */

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const groceryService = req.scope.resolve("grocery") as unknown as any;
    const { zone_id, date } = req.query as { zone_id?: string; date?: string };

    if (!zone_id || !date) {
      return res.status(400).json({ error: "zone_id and date are required" });
    }

    const slots = await groceryService.getAvailableSlots(zone_id, date);
    return res.json({ slots, count: slots.length });
  } catch (error: unknown) {
    return handleApiError(res, error, "STORE-GROCERY-SLOTS");
  }
}
