import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { handleApiError } from "../../../lib/api-error-handler";

interface CityOSContext {
  vendorId?: string;
  tenantId?: string;
  storeId?: string;
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const vendorModule = req.scope.resolve("vendor") as unknown as any;
    const commissionModule = req.scope.resolve("commission") as unknown as any;
    const payoutModule = req.scope.resolve("payout") as unknown as any;

    const context = req.cityosContext as CityOSContext | undefined;

    if (!context?.vendorId) {
      return res.status(403).json({ message: "Vendor context required" });
    }

    // Get vendor details
    const vendor = await vendorModule.retrieveVendor(context.vendorId);

    // Get commission stats
    const transactions = await commissionModule.listCommissions({
      vendor_id: context.vendorId,
      status: "approved",
    });

    const transactionCount = Array.isArray(transactions)
      ? transactions.length
      : 0;
    const totalEarnings = (transactions || []).reduce(
      (sum: number, tx: any) => sum + Number(tx.net_amount || 0),
      0,
    );
    const totalCommission = (transactions || []).reduce(
      (sum: number, tx: any) => sum + Number(tx.commission_amount || 0),
      0,
    );

    // Get recent payouts
    const payouts = await payoutModule.listPayouts(
      {
        vendor_id: context.vendorId,
      },
      {
        take: 5,
      },
    );

    return res.json({
      vendor,
      stats: {
        totalOrders: transactionCount,
        totalEarnings,
        totalCommission,
        pendingPayout:
          (vendor?.total_sales || 0) - (vendor?.total_commission_paid || 0),
      },
      recentPayouts: payouts,
    });
  } catch (error: unknown) {
    handleApiError(res, error, "GET vendor dashboard");
  }
}
