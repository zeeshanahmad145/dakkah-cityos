import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { handleApiError } from "../../../lib/api-error-handler";

// GET /vendor/commissions - Get vendor's commission history
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY) as unknown as any;

    const vendorId = req.vendor_id;
    if (!vendorId) {
      return res
        .status(401)
        .json({ message: "Vendor authentication required" });
    }

    const { limit = 50, offset = 0 } = req.query;

    // Get commission transactions for this vendor
    const { data: transactions } = await query.graph({
      entity: "commission_transaction",
      fields: [
        "id",
        "vendor_id",
        "order_id",
        "gross_amount",
        "commission_amount",
        "net_amount",
        "commission_rate",
        "status",
        "payout_status",
        "created_at",
        "order.display_id",
      ],
      filters: {
        vendor_id: vendorId,
      },
      pagination: {
        skip: Number(offset),
        take: Number(limit),
      },
    });

    // Calculate summary
    let totalGross = 0;
    let totalCommission = 0;
    let totalNet = 0;
    let avgRate = 0;

    transactions.forEach((t: any) => {
      totalGross += Number(t.gross_amount) || 0;
      totalCommission += Number(t.commission_amount) || 0;
      totalNet += Number(t.net_amount) || 0;
      avgRate += Number(t.commission_rate) || 0;
    });

    const commissions = transactions.map((t: any) => ({
      id: t.id,
      order_id: t.order_id,
      order_display_id: t.order?.display_id,
      gross_amount: t.gross_amount,
      commission_amount: t.commission_amount,
      net_amount: t.net_amount,
      commission_rate: t.commission_rate,
      status: t.status,
      payout_status: t.payout_status,
      created_at: t.created_at,
    }));

    res.json({
      commissions,
      summary: {
        total_gross: totalGross,
        total_commission: totalCommission,
        total_net: totalNet,
        commission_rate:
          transactions.length > 0 ? avgRate / transactions.length : 0,
      },
      count: transactions.length,
    });
  } catch (error: unknown) {
    handleApiError(res, error, "GET vendor commissions");
  }
}
