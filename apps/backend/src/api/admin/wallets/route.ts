import type { MedusaRequest, MedusaResponse } from "@medusajs/framework";
import { handleApiError } from "../../../lib/api-error-handler";

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const walletService = req.scope.resolve("wallet") as any;
  const limit = parseInt((req.query.limit as string) || "20");
  const offset = parseInt((req.query.offset as string) || "0");

  try {
    const wallets = await walletService.listWallets(
      {},
      { take: limit, skip: offset },
    );
    const count = await walletService.countWallets();
    return res.json({ wallets: Array.isArray(wallets) ? wallets : [], count });
  } catch (error: any) {
    return handleApiError(res, error, "List wallets");
  }
}
