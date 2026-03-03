import { MedusaService } from "@medusajs/framework/utils";
import { VendorProjection } from "./models/vendor-projection";
import { createLogger } from "../../lib/logger";

const logger = createLogger("service:projections");

class ProjectionsModuleService extends MedusaService({ VendorProjection }) {
  /**
   * Refresh the vendor projection for a given period.
   * Called by the vendor-projection-refresh cron job.
   */
  async refreshVendorProjection(
    vendorId: string,
    period: string,
    settlementService: any,
  ): Promise<any> {
    const periodDates = this._getPeriodDates(period);

    // Fetch all settled ledgers for this vendor in period
    const ledgers = (await settlementService.listSettlementLedgers({
      vendor_id: vendorId,
    })) as any[];

    const inPeriod = ledgers.filter((l: any) => {
      const created = new Date(l.created_at);
      return created >= periodDates.start && created <= periodDates.end;
    });

    const gross = inPeriod.reduce(
      (s: number, l: any) => s + (l.gross_amount ?? 0),
      0,
    );
    const netPayout = inPeriod.reduce(
      (s: number, l: any) => s + (l.net_payout ?? 0),
      0,
    );
    const pendingPayout = inPeriod
      .filter((l: any) => l.status === "pending")
      .reduce((s: number, l: any) => s + (l.net_payout ?? 0), 0);
    const refunds = inPeriod.reduce(
      (s: number, l: any) => s + (l.refund_total ?? 0),
      0,
    );
    const platformFee = inPeriod.reduce(
      (s: number, l: any) => s + (l.platform_fee ?? 0),
      0,
    );
    const aov = inPeriod.length > 0 ? gross / inPeriod.length : 0;

    // Upsert the projection
    const existing = (await this.listVendorProjections({
      vendor_id: vendorId,
      period,
    })) as any[];
    if (existing[0]) {
      return this.updateVendorProjections({
        id: existing[0].id,
        total_orders: inPeriod.length,
        gross_revenue: gross,
        net_payout: netPayout,
        pending_payout: pendingPayout,
        refund_total: refunds,
        platform_fee_total: platformFee,
        average_order_value: aov,
        last_refreshed_at: new Date(),
      } as any);
    }

    return this.createVendorProjections({
      vendor_id: vendorId,
      period,
      total_orders: inPeriod.length,
      gross_revenue: gross,
      net_payout: netPayout,
      pending_payout: pendingPayout,
      refund_total: refunds,
      platform_fee_total: platformFee,
      average_order_value: aov,
      last_refreshed_at: new Date(),
    } as any);
  }

  /**
   * Get projection for a vendor (fast dashboard read).
   */
  async getVendorDashboard(vendorId: string): Promise<{
    today: any;
    mtd: any;
    ytd: any;
  }> {
    const [today, mtd, ytd] = await Promise.all([
      this.listVendorProjections({ vendor_id: vendorId, period: "today" }),
      this.listVendorProjections({ vendor_id: vendorId, period: "mtd" }),
      this.listVendorProjections({ vendor_id: vendorId, period: "ytd" }),
    ]);
    return {
      today: (today as any[])[0] ?? null,
      mtd: (mtd as any[])[0] ?? null,
      ytd: (ytd as any[])[0] ?? null,
    };
  }

  private _getPeriodDates(period: string): { start: Date; end: Date } {
    const now = new Date();
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);

    if (period === "today") {
      const end = new Date(now);
      end.setHours(23, 59, 59, 999);
      return { start: today, end };
    }
    if (period === "yesterday") {
      const start = new Date(today);
      start.setDate(start.getDate() - 1);
      const end = new Date(today);
      end.setMilliseconds(-1);
      return { start, end };
    }
    if (period === "mtd") {
      return {
        start: new Date(now.getFullYear(), now.getMonth(), 1),
        end: now,
      };
    }
    if (period === "ytd") {
      return { start: new Date(now.getFullYear(), 0, 1), end: now };
    }
    // ISO date string
    const d = new Date(period);
    d.setHours(0, 0, 0, 0);
    const end = new Date(d);
    end.setHours(23, 59, 59, 999);
    return { start: d, end };
  }
}

export default ProjectionsModuleService;
