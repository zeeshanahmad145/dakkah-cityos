import type { MedusaRequest, MedusaResponse } from "@medusajs/framework";
import { handleApiError } from "../../../../../lib/api-error-handler";

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const session = req.auth_context as any;
  const customerId = session?.actor_id;

  if (!customerId) {
    return res.status(401).json({ message: "Not authenticated" });
  }

  const walletService = req.scope.resolve("wallet") as any;
  const limit = parseInt((req.query.limit as string) || "20");
  const offset = parseInt((req.query.offset as string) || "0");

  try {
    let wallets = await walletService.listWallets({ customer_id: customerId });
    wallets = Array.isArray(wallets) ? wallets : [wallets].filter(Boolean);

    if (wallets.length === 0) {
      return res.json({ transactions: [], count: 0 });
    }

    const transactions = await walletService.getTransactionHistory(
      wallets[0].id,
      { limit, offset },
    );
    return res.json({ transactions, count: transactions.length });
  } catch (error: any) {
    return handleApiError(res, error, "Wallet transactions");
  }
}
