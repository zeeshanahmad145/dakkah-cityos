import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { handleApiError } from "../../../../lib/api-error-handler";

// GET /admin/commissions/pending — list unpaid commission transactions
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const commissionService = req.scope.resolve("commission") as unknown as any;
    const {
      vendor_id,
      tenant_id,
      limit = "50",
      offset = "0",
    } = req.query as Record<string, string | undefined>;

    const filters: Record<string, unknown> = { payout_status: "unpaid", status: "pending" };
    if (vendor_id) filters.vendor_id = vendor_id;
    if (tenant_id) filters.tenant_id = tenant_id;

    const transactions = await commissionService.listCommissionTransactions(
      filters,
      {
        take: Number(limit),
        skip: Number(offset),
        order: { transaction_date: "DESC" },
      },
    );

    const list = Array.isArray(transactions) ? transactions : [];
    const totalUnpaid = list.reduce(
      (sum: number, t: any) => sum + Number(t.commission_amount || 0),
      0,
    );

    return res.json({
      transactions: list,
      count: list.length,
      total_unpaid: totalUnpaid,
    });
  } catch (error: unknown) {
    return handleApiError(res, error, "ADMIN-COMMISSIONS-PENDING");
  }
}

// POST /admin/commissions/pending — bulk settle
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const commissionService = req.scope.resolve("commission") as unknown as any;
    const { transaction_ids } = req.body as { transaction_ids: string[] };

    if (!transaction_ids?.length) {
      return res
        .status(400)
        .json({ error: "transaction_ids array is required" });
    }

    const result =
      await commissionService.processCommissionPayout(transaction_ids);
    return res.json({
      result,
      message: `Settled ${result.processed_count} commission transactions`,
    });
  } catch (error: unknown) {
    return handleApiError(res, error, "ADMIN-COMMISSIONS-SETTLE");
  }
}
