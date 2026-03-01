import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { handleApiError } from "../../../../lib/api-error-handler";

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const service = req.scope.resolve("loyalty") as unknown as any;
    const filters: Record<string, any> = {};
    if (req.query.program_id) filters.program_id = req.query.program_id;
    if (req.query.customer_id) filters.customer_id = req.query.customer_id;
    const accounts = await service.listLoyaltyAccounts(filters);
    res.json({
      accounts: Array.isArray(accounts) ? accounts : [accounts].filter(Boolean),
    });
  } catch (error: unknown) {
    return handleApiError(res, error, "ADMIN-LOYALTY-ACCOUNTS");
  }
}
