import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { handleApiError } from "../../../../lib/api-error-handler";

/**
 * GET  /admin/insurance/claims         — list all claims with status filter
 * PATCH /admin/insurance/claims/:id    — approve or deny a claim, trigger payout
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const insuranceService = req.scope.resolve("insurance") as unknown as any;
    const {
      limit = "20",
      offset = "0",
      status,
    } = req.query as Record<string, string | undefined>;

    const filters: Record<string, unknown> = {};
    if (status) filters.status = status;

    const claims = await (insuranceService as any).listInsuranceClaims(filters, {
      skip: Number(offset),
      take: Number(limit),
    });
    const list = Array.isArray(claims) ? claims : [claims].filter(Boolean);

    return res.json({
      claims: list,
      count: list.length,
      limit: Number(limit),
      offset: Number(offset),
    });
  } catch (error: unknown) {
    return handleApiError(res, error, "ADMIN-INSURANCE-CLAIMS-LIST");
  }
}
