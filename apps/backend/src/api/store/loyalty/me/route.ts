import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { handleApiError } from "../../../../lib/api-error-handler";

/**
 * GET /store/loyalty/me
 * Returns the current customer's loyalty account balance, tier, and transaction history.
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const loyaltyService = req.scope.resolve("loyalty") as unknown as any;
    const customerId = req.auth_context?.actor_id;

    if (!customerId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const { tenant_id } = req.query as { tenant_id?: string };

    // Find the customer's loyalty account
    const accountFilters: any = { customer_id: customerId };
    const accounts = await loyaltyService.listLoyaltyAccounts(accountFilters);
    const accountList = Array.isArray(accounts)
      ? accounts
      : [accounts].filter(Boolean);

    if (accountList.length === 0) {
      return res.json({ account: null, message: "No loyalty account found" });
    }

    const account = accountList[0];
    const balance = await loyaltyService.getBalance(account.id);
    const history = await loyaltyService.getTransactionHistory(account.id, {
      limit: 10,
    });

    return res.json({
      account: {
        id: account.id,
        program_id: account.program_id,
        status: account.status,
        ...balance,
      },
      recent_transactions: history,
    });
  } catch (error: unknown) {
    return handleApiError(res, error, "STORE-LOYALTY-ME");
  }
}
