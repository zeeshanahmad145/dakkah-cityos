import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { handleApiError } from "../../../../../../../lib/api-error-handler";

/**
 * POST /store/grocery/delivery-slots/:id/book
 * Book a specific delivery slot for an order.
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const groceryService = req.scope.resolve("grocery") as unknown as any;
    const slotId = req.params.id;
    const { order_id } = req.body as { order_id: string };

    if (!order_id) {
      return res.status(400).json({ error: "order_id is required" });
    }

    const booking = await groceryService.bookDeliverySlot(slotId, order_id);
    return res.status(201).json({ booking });
  } catch (error: unknown) {
    return handleApiError(res, error, "STORE-GROCERY-BOOK-SLOT");
  }
}
