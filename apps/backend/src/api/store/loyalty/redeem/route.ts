import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { handleApiError } from "../../../../lib/api-error-handler";

/**
 * POST /store/loyalty/redeem
 * Redeems loyalty points from the customer's account.
 * Returns a discount token for checkout.
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const loyaltyService = req.scope.resolve("loyalty") as unknown as any;
    const customerId = req.auth_context?.actor_id;

    if (!customerId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const { account_id, points, order_id } = req.body as {
      account_id: string;
      points: number;
      order_id?: string;
    };

    if (!account_id || !points || points <= 0) {
      return res
        .status(400)
        .json({ error: "account_id and points > 0 are required" });
    }

    const transaction = await loyaltyService.redeemPoints({
      accountId: account_id,
      points,
      referenceType: "order",
      referenceId: order_id,
      description: "Points redemption at checkout",
    });

    const balance = await loyaltyService.getBalance(account_id);

    return res.status(201).json({
      transaction,
      new_balance: balance.points_balance,
      // Points value: configurable, default 1pt = $0.01
      discount_value: points * 0.01,
    });
  } catch (error: unknown) {
    return handleApiError(res, error, "STORE-LOYALTY-REDEEM");
  }
}
