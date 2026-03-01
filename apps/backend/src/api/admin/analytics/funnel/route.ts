import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { handleApiError } from "../../../../lib/api-error-handler";

/**
 * GET /admin/analytics/funnel
 * Returns the 30-day conversion funnel metrics.
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const analyticsService = req.scope.resolve("analytics") as unknown as any;
    const { tenant_id, days = "30" } = req.query as {
      tenant_id?: string;
      days?: string;
    };

    if (!tenant_id) {
      return res.status(400).json({ error: "tenant_id is required" });
    }

    const now = new Date();
    const start = new Date(now.getTime() - Number(days) * 24 * 60 * 60 * 1000);
    const funnel = await analyticsService.getConversionFunnel(tenant_id, {
      start,
      end: now,
    });

    return res.json({ funnel, date_range: { start, end: now } });
  } catch (error: unknown) {
    return handleApiError(res, error, "ADMIN-ANALYTICS-FUNNEL");
  }
}
