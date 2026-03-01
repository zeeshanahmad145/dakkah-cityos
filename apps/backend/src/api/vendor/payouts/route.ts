import type { MedusaRequest, MedusaResponse } from "@medusajs/framework";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { handleApiError } from "../../../lib/api-error-handler";

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY) as unknown as any;
    const context = req.cityosContext;
    const vendorId = context?.vendorId || req.vendor_id;

    if (!vendorId) {
      return res.status(403).json({ message: "Vendor context required" });
    }

    const { limit = 50, offset = 0 } = req.query;

    // Get payouts
    const { data: payouts } = await query.graph({
      entity: "payout",
      fields: [
        "id",
        "payout_number",
        "amount",
        "status",
        "created_at",
        "processed_at",
        "stripe_transfer_id",
      ],
      filters: {
        vendor_id: vendorId,
      },
      pagination: {
        skip: Number(offset),
        take: Number(limit),
      },
    });

    // Get unpaid commission totals for available balance
    const { data: unpaidCommissions } = await query.graph({
      entity: "commission_transaction",
      fields: ["net_amount", "payout_status"],
      filters: {
        vendor_id: vendorId,
        payout_status: "unpaid",
        status: "approved",
      },
    });

    // Get pending payout totals
    const { data: pendingPayouts } = await query.graph({
      entity: "payout",
      fields: ["amount"],
      filters: {
        vendor_id: vendorId,
        status: ["pending", "processing"],
      },
    });

    // Calculate balances
    const availableBalance = unpaidCommissions.reduce(
      (sum: number, c: any) => sum + (Number(c.net_amount) || 0),
      0,
    );

    const pendingBalance = pendingPayouts.reduce(
      (sum: number, p: any) => sum + (Number(p.amount) || 0),
      0,
    );

    const totalPaid = payouts
      .filter((p: any) => p.status === "completed")
      .reduce((sum: number, p: any) => sum + (Number(p.amount) || 0), 0);

    return res.json({
      payouts: payouts.map((p: any) => ({
        id: p.id,
        payout_number: p.payout_number,
        amount: p.amount,
        status: p.status,
        created_at: p.created_at,
        processed_at: p.processed_at,
      })),
      summary: {
        available_balance: availableBalance,
        pending_balance: pendingBalance,
        total_paid: totalPaid,
      },
      count: payouts.length,
    });
  } catch (error: unknown) {
    handleApiError(res, error, "GET vendor payouts");
  }
}
