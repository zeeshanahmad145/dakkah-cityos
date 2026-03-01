import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { handleApiError } from "../../../../lib/api-error-handler";

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const service = req.scope.resolve("inventoryExtension") as unknown as any;
    const filters: Record<string, any> = {};
    if (req.query.status) filters.status = req.query.status;
    const transfers = await service.listWarehouseTransfers(filters);
    res.json({
      transfers: Array.isArray(transfers)
        ? transfers
        : [transfers].filter(Boolean),
    });
  } catch (error: unknown) {
    return handleApiError(res, error, "ADMIN-INVENTORY-EXT-TRANSFERS");
  }
}
