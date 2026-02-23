import type { MedusaRequest, MedusaResponse } from "@medusajs/framework";
import { handleApiError } from "../../../../lib/api-error-handler";

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const walletService = req.scope.resolve("wallet") as any;
  const { id } = req.params;

  try {
    const wallet = await walletService.retrieveWallet(id);
    const transactions = await walletService.getTransactionHistory(id, {
      limit: 50,
    });
    return res.json({ wallet, transactions });
  } catch (error: any) {
    return handleApiError(res, error, "Wallet retrieval");
  }
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const walletService = req.scope.resolve("wallet") as any;
  const { id } = req.params;
  const { type, amount, description, reference_id } = req.body as any;

  if (!type || !["credit", "debit"].includes(type)) {
    return res
      .status(400)
      .json({ message: "type must be 'credit' or 'debit'" });
  }
  if (!amount || amount <= 0) {
    return res.status(400).json({ message: "amount must be positive" });
  }

  try {
    let transaction;
    if (type === "credit") {
      transaction = await walletService.creditWallet(
        id,
        amount,
        description,
        reference_id,
      );
    } else {
      transaction = await walletService.debitWallet(
        id,
        amount,
        description,
        reference_id,
      );
    }
    return res.json({ transaction });
  } catch (error: any) {
    return handleApiError(res, error, "Wallet transaction");
  }
}
