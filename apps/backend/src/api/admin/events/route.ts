import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { handleApiError } from "../../../lib/api-error-handler";

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const moduleService = req.scope.resolve("eventModuleService") as unknown as any;
    const {
      limit = "20",
      offset = "0",
      tenant_id,
      status,
      event_type,
      aggregate_type,
    } = req.query as Record<string, string | undefined>;
    const filters: Record<string, any> = {};
    if (tenant_id) filters.tenant_id = tenant_id;
    if (status) filters.status = status;
    if (event_type) filters.event_type = event_type;
    if (aggregate_type) filters.aggregate_type = aggregate_type;
    const items = await moduleService.listEventOutboxes(filters, {
      skip: Number(offset),
      take: Number(limit),
    });
    return res.json({
      items,
      count: Array.isArray(items) ? items.length : 0,
      limit: Number(limit),
      offset: Number(offset),
    });
  } catch (error: unknown) {
    handleApiError(res, error, "GET admin events");
  }
}
