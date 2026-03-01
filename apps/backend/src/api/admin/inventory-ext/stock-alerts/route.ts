import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { handleApiError } from "../../../../lib/api-error-handler";

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const service = req.scope.resolve("inventoryExtension") as unknown as any;
    const filters: Record<string, any> = {};
    if (req.query.alert_type) filters.alert_type = req.query.alert_type;
    if (req.query.is_resolved !== undefined)
      filters.is_resolved = req.query.is_resolved === "true";
    const alerts = await service.listStockAlerts(filters);
    res.json({
      alerts: Array.isArray(alerts) ? alerts : [alerts].filter(Boolean),
    });
  } catch (error: unknown) {
    return handleApiError(res, error, "ADMIN-INVENTORY-EXT-STOCK-ALERTS");
  }
}
