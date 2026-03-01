import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { handleApiError } from "../../../lib/api-error-handler";

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const moduleService = req.scope.resolve("audit") as unknown as any;
    const {
      limit = "20",
      offset = "0",
      tenant_id,
      resource_type,
      action,
      actor_id,
    } = req.query as Record<string, string | undefined>;
    const filters: Record<string, any> = {};
    if (tenant_id) filters.tenant_id = tenant_id;
    if (resource_type) filters.resource_type = resource_type;
    if (action) filters.action = action;
    if (actor_id) filters.actor_id = actor_id;
    const items = await moduleService.listAuditLogs(filters, {
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
    handleApiError(res, error, "GET admin audit");
  }
}
