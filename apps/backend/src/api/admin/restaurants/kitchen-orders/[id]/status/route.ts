import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { handleApiError } from "../../../../../../lib/api-error-handler";

/**
 * PATCH /admin/kitchen-orders/:id/status
 * Update the status of a kitchen order (confirming, preparing, ready, delivered).
 */
export async function PATCH(req: MedusaRequest, res: MedusaResponse) {
  try {
    const restaurantService = req.scope.resolve("restaurant") as unknown as any;
    const orderId = req.params.id;
    const { status } = req.body as { status: string };

    if (!status) {
      return res.status(400).json({ error: "status is required" });
    }

    const updated = await restaurantService.updateOrderStatus(orderId, status);
    return res.json({ order: updated });
  } catch (error: unknown) {
    return handleApiError(res, error, "ADMIN-KITCHEN-ORDER-STATUS");
  }
}
