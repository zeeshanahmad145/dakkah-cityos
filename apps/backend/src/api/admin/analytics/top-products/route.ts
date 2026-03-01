import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { handleApiError } from "../../../../lib/api-error-handler";

/**
 * GET /admin/analytics/top-products
 * Returns top products by revenue for a tenant.
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const analyticsService = req.scope.resolve("analytics") as unknown as any;
    const {
      tenant_id,
      limit = "10",
      days = "30",
    } = req.query as {
      tenant_id?: string;
      limit?: string;
      days?: string;
    };

    if (!tenant_id) {
      return res.status(400).json({ error: "tenant_id is required" });
    }

    const now = new Date();
    const start = new Date(now.getTime() - Number(days) * 24 * 60 * 60 * 1000);
    const products = await analyticsService.getTopProducts(
      tenant_id,
      Number(limit),
      { start, end: now },
    );

    return res.json({ products, count: products.length });
  } catch (error: unknown) {
    return handleApiError(res, error, "ADMIN-ANALYTICS-TOP-PRODUCTS");
  }
}
