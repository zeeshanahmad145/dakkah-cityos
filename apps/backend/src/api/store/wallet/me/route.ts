import type { MedusaRequest, MedusaResponse } from "@medusajs/framework";
import { WALLET_MODULE } from "../../../../modules/wallet";
import { handleApiError } from "../../../../lib/api-error-handler";

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const session = req.auth_context;
  const customerId = session?.actor_id;

  if (!customerId) {
    return res.status(401).json({ message: "Not authenticated" });
  }

  const walletService = req.scope.resolve(WALLET_MODULE) as unknown as any;

  try {
    let wallets = await walletService.listWallets({ customer_id: customerId });
    wallets = Array.isArray(wallets) ? wallets : [wallets].filter(Boolean);

    if (wallets.length === 0) {
      const wallet = await walletService.createWallet(customerId, "usd");
      return res.json({ wallet });
    }

    const wallet = wallets[0];
    return res.json({ wallet });
  } catch (error: unknown) {
    return handleApiError(res, error, "Get customer wallet");
  }
}
