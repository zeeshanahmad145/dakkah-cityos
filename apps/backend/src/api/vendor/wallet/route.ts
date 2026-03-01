import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { handleApiError } from "../../../lib/api-error-handler";

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const vendorId = req.vendor_id;
    if (!vendorId) {
      return res
        .status(401)
        .json({ message: "Vendor authentication required" });
    }

    const mod = req.scope.resolve("loyalty") as unknown as any;
    const { limit = "20", offset = "0" } = req.query as Record<
      string,
      string | undefined
    >;

    const filters: Record<string, any> = { vendor_id: vendorId };

    const items = await mod.listLoyaltyAccounts(filters, {
      skip: Number(offset),
      take: Number(limit),
      order: { created_at: "DESC" },
    });

    const accounts = Array.isArray(items) ? items : [items].filter(Boolean);

    const balance = accounts.reduce(
      (sum: number, acc: any) => sum + (acc.balance || 0),
      0,
    );
    const pending = accounts.reduce(
      (sum: number, acc: any) => sum + (acc.pending || 0),
      0,
    );
    const total_earned = accounts.reduce(
      (sum: number, acc: any) => sum + (acc.total_earned || 0),
      0,
    );
    const currency_code = accounts[0]?.currency_code || "usd";

    const transactions = accounts.flatMap((acc: any) => {
      if (!acc.activity || !Array.isArray(acc.activity)) {
        return [];
      }
      return acc.activity.map((activity: any) => ({
        id: activity.id || `${acc.id}-${activity.created_at}`,
        date: activity.created_at || new Date().toISOString(),
        type: activity.type || "transaction",
        amount: activity.amount || 0,
        reference: activity.reference || acc.id,
        currency_code: acc.currency_code || currency_code,
      }));
    });

    return res.json({
      balance,
      pending,
      total_earned,
      currency_code,
      transactions,
    });
  } catch (error: unknown) {
    handleApiError(res, error, "GET vendor wallet");
  }
}
