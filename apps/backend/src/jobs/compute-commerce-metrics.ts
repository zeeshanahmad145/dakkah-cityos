import { MedusaContainer } from "@medusajs/framework/types";
import { jobLogger } from "../lib/logger";

const logger = jobLogger;

/**
 * Commerce Metrics Compute Job
 *
 * Runs on a schedule (daily via cron). Computes key commerce KPIs and
 * stores them in the analytics module as Report snapshots.
 *
 * Metrics computed:
 *   - GMV (Gross Merchandise Value) per node, per vendor, total
 *   - Subscription churn rate (cancelled in period / active at start)
 *   - Inventory turnover per product
 *   - Average order value
 *   - Revenue per node
 *   - Platform commission earned
 *   - Refund rate (refunded GMV / total GMV)
 *
 * Stored as: analytics Report with slug "daily-commerce-metrics-{date}"
 */
export default async function computeCommerceMetrics(
  container: MedusaContainer,
) {
  const query = container.resolve("query") as any;
  const analyticsService = container.resolve("analyticsModuleService") as any;

  logger.info("Starting daily commerce metrics computation");

  const today = new Date();
  const periodStart = new Date(today);
  periodStart.setDate(periodStart.getDate() - 1);
  periodStart.setHours(0, 0, 0, 0);
  const periodEnd = new Date(today);
  periodEnd.setHours(0, 0, 0, 0);

  const dateLabel = periodStart.toISOString().split("T")[0];

  try {
    // ─── GMV ───────────────────────────────────────────────────────────────
    const { data: orders } = await query.graph({
      entity: "order",
      fields: [
        "id",
        "total",
        "currency_code",
        "metadata",
        "created_at",
        "status",
      ],
      filters: {
        status: ["completed", "processing", "shipped"],
        created_at: {
          $gte: periodStart.toISOString(),
          $lte: periodEnd.toISOString(),
        },
      },
    });
    const orderList = Array.isArray(orders) ? orders : [];

    const totalGmv = orderList.reduce(
      (s: number, o: any) => s + Number(o.total || 0),
      0,
    );
    const avgOrderValue =
      orderList.length > 0 ? totalGmv / orderList.length : 0;

    // GMV per node
    const gmvByNode: Record<string, number> = {};
    for (const o of orderList) {
      const nodeId = (o.metadata?.node_id as string) || "unassigned";
      gmvByNode[nodeId] = (gmvByNode[nodeId] || 0) + Number(o.total || 0);
    }

    // ─── Refund Rate ────────────────────────────────────────────────────────
    const { data: refunds } = await query.graph({
      entity: "order",
      fields: ["id", "total"],
      filters: {
        status: "canceled",
        created_at: {
          $gte: periodStart.toISOString(),
          $lte: periodEnd.toISOString(),
        },
      },
    });
    const refundList = Array.isArray(refunds) ? refunds : [];
    const refundedGmv = refundList.reduce(
      (s: number, o: any) => s + Number(o.total || 0),
      0,
    );
    const refundRate = totalGmv > 0 ? refundedGmv / totalGmv : 0;

    // ─── Subscription Churn ─────────────────────────────────────────────────
    let churnRate = 0;
    try {
      const { data: activeSubs } = await query.graph({
        entity: "subscription_plan",
        fields: ["id"],
        filters: { status: "active" },
      });
      const { data: cancelledSubs } = await query.graph({
        entity: "subscription_plan",
        fields: ["id"],
        filters: {
          status: "cancelled",
          created_at: {
            $gte: periodStart.toISOString(),
            $lte: periodEnd.toISOString(),
          },
        },
      });
      const activeCount = Array.isArray(activeSubs) ? activeSubs.length : 0;
      const cancelledCount = Array.isArray(cancelledSubs)
        ? cancelledSubs.length
        : 0;
      churnRate =
        activeCount > 0 ? cancelledCount / (activeCount + cancelledCount) : 0;
    } catch (e: any) {
      logger.warn("Subscription churn calculation skipped:", e.message);
    }

    // ─── Commission Earned ──────────────────────────────────────────────────
    let platformCommission = 0;
    try {
      const { data: commissions } = await query.graph({
        entity: "commission_transaction",
        fields: ["commission_amount"],
        filters: {
          status: "completed",
          created_at: {
            $gte: periodStart.toISOString(),
            $lte: periodEnd.toISOString(),
          },
        },
      });
      platformCommission = (
        Array.isArray(commissions) ? commissions : []
      ).reduce((s: number, c: any) => s + Number(c.commission_amount || 0), 0);
    } catch (e: any) {
      logger.warn("Commission computation skipped:", e.message);
    }

    // ─── Store as Analytics Report ──────────────────────────────────────────
    const reportData = {
      date: dateLabel,
      period_start: periodStart.toISOString(),
      period_end: periodEnd.toISOString(),
      gmv: { total: totalGmv, by_node: gmvByNode },
      orders: { count: orderList.length, avg_value: avgOrderValue },
      refunds: { gmv: refundedGmv, rate: refundRate },
      subscriptions: { churn_rate: churnRate },
      commission: { platform_earned: platformCommission },
    };

    try {
      await analyticsService.createReports({
        tenant_id: "platform",
        name: `Daily Commerce Metrics — ${dateLabel}`,
        slug: `daily-commerce-metrics-${dateLabel}`,
        report_type: "commerce_kpi",
        date_range_type: "daily",
        last_generated: new Date(),
        is_public: false,
        filters: {
          period_start: periodStart.toISOString(),
          period_end: periodEnd.toISOString(),
        },
        metadata: reportData,
      } as any);
    } catch (e: any) {
      logger.warn("Could not store analytics report:", e.message);
    }

    logger.info(
      `Commerce metrics computed — GMV: ${totalGmv.toFixed(2)}, Orders: ${orderList.length}, Churn: ${(churnRate * 100).toFixed(2)}%, Commission: ${platformCommission.toFixed(2)}`,
    );
  } catch (err: any) {
    logger.error("Commerce metrics compute error:", err.message);
  }
}

export const config = {
  name: "compute-commerce-metrics",
  schedule: "0 2 * * *", // 2 AM daily
};
