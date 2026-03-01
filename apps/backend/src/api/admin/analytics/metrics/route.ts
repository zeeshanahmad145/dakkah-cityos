import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { handleApiError } from "../../../../lib/api-error-handler";

/**
 * GET /admin/analytics/metrics
 * Returns dashboard metrics for the last 30 days.
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const analyticsService = req.scope.resolve("analytics") as unknown as any;
    const { tenant_id } = req.query as { tenant_id?: string };

    if (!tenant_id) {
      return res.status(400).json({ error: "tenant_id is required" });
    }

    const metrics = await analyticsService.generateDashboardMetrics(tenant_id);
    return res.json({ metrics });
  } catch (error: unknown) {
    return handleApiError(res, error, "ADMIN-ANALYTICS-METRICS");
  }
}

/**
 * POST /admin/analytics/metrics/events
 * Track a new analytics event.
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const analyticsService = req.scope.resolve("analytics") as unknown as any;
    const event = await analyticsService.trackEvent(req.body);
    return res.status(201).json({ event });
  } catch (error: unknown) {
    return handleApiError(res, error, "ADMIN-ANALYTICS-TRACK");
  }
}
