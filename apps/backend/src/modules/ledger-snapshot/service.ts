import { MedusaService } from "@medusajs/framework/utils";
import { DailyLedgerSnapshot } from "./models/daily-ledger-snapshot";
import { createLogger } from "../../lib/logger";

const logger = createLogger("service:ledger-snapshot");

const DRIFT_THRESHOLD_PERCENT = parseFloat(
  process.env.LEDGER_DRIFT_THRESHOLD_PERCENT ?? "0.5",
);

class LedgerSnapshotModuleService extends MedusaService({
  DailyLedgerSnapshot,
}) {
  /**
   * Compute today's Medusa settlement totals from the settlement module.
   * Called by the ledger-snapshot cron job.
   */
  async computeMedusaTotals(
    settlementService: any,
    snapshotDate: Date,
    tenantId?: string,
    vendorId?: string,
  ): Promise<{
    gross: number;
    tax: number;
    commission: number;
    netPayout: number;
    refunds: number;
  }> {
    const startOfDay = new Date(snapshotDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(snapshotDate);
    endOfDay.setHours(23, 59, 59, 999);

    const ledgers = (await settlementService.listSettlementLedgers({
      ...(tenantId ? { tenant_id: tenantId } : {}),
      ...(vendorId ? { vendor_id: vendorId } : {}),
    })) as any[];

    const dayLedgers = ledgers.filter((l: any) => {
      const d = new Date(l.created_at);
      return d >= startOfDay && d <= endOfDay;
    });

    return dayLedgers.reduce(
      (acc, l) => ({
        gross: acc.gross + (l.gross_amount ?? 0),
        tax: acc.tax + (l.tax_collected ?? 0),
        commission: acc.commission + (l.platform_fee ?? 0),
        netPayout: acc.netPayout + (l.net_payout ?? 0),
        refunds: acc.refunds + (l.refund_total ?? 0),
      }),
      { gross: 0, tax: 0, commission: 0, netPayout: 0, refunds: 0 },
    );
  }

  /**
   * Fetch totals from ERPNext for the same day.
   */
  async fetchErpTotals(
    snapshotDate: Date,
    vendorId?: string,
  ): Promise<{ gross: number; tax: number; netPayout: number }> {
    const ERP_URL = process.env.ERPNEXT_API_URL ?? "";
    const ERP_KEY = process.env.ERPNEXT_API_KEY ?? "";
    if (!ERP_URL) return { gross: 0, tax: 0, netPayout: 0 };

    try {
      const dateStr = snapshotDate.toISOString().split("T")[0];
      const url = `${ERP_URL}/api/method/dakkah.api.settlement_summary?date=${dateStr}${vendorId ? `&vendor_id=${vendorId}` : ""}`;
      const resp = await fetch(url, {
        headers: { Authorization: `token ${ERP_KEY}` },
      });
      if (!resp.ok) throw new Error(`ERP ${resp.status}`);
      const data: any = await resp.json();
      return {
        gross: data.message?.gross ?? 0,
        tax: data.message?.tax ?? 0,
        netPayout: data.message?.net_payout ?? 0,
      };
    } catch (err) {
      logger.warn(
        `ERP fetch failed for ${snapshotDate.toISOString().split("T")[0]}: ${String(err)}`,
      );
      return { gross: 0, tax: 0, netPayout: 0 };
    }
  }

  /**
   * Record a snapshot and detect drift.
   * Returns { aboveThreshold, snapshot }
   */
  async recordSnapshot(params: {
    snapshotDate: Date;
    tenantId?: string;
    vendorId?: string;
    medusaTotals: {
      gross: number;
      tax: number;
      commission: number;
      netPayout: number;
      refunds: number;
    };
    erpTotals: { gross: number; tax: number; netPayout: number };
  }): Promise<{ aboveThreshold: boolean; snapshot: any }> {
    const driftAmount = Math.abs(
      params.medusaTotals.netPayout - params.erpTotals.netPayout,
    );
    const driftPct =
      params.medusaTotals.netPayout > 0
        ? (driftAmount / params.medusaTotals.netPayout) * 100
        : 0;
    const aboveThreshold = driftPct > DRIFT_THRESHOLD_PERCENT;

    const snapshot = await this.createDailyLedgerSnapshots({
      snapshot_date: params.snapshotDate,
      tenant_id: params.tenantId ?? null,
      vendor_id: params.vendorId ?? null,
      medusa_gross: params.medusaTotals.gross,
      medusa_tax: params.medusaTotals.tax,
      medusa_commission: params.medusaTotals.commission,
      medusa_net_payout: params.medusaTotals.netPayout,
      medusa_refunds: params.medusaTotals.refunds,
      erp_gross: params.erpTotals.gross,
      erp_tax: params.erpTotals.tax,
      erp_net_payout: params.erpTotals.netPayout,
      drift_amount: driftAmount,
      drift_percentage: driftPct,
      above_threshold: aboveThreshold,
      payout_frozen: aboveThreshold,
    } as any);

    if (aboveThreshold) {
      logger.warn(
        `LEDGER DRIFT ALERT: ${driftPct.toFixed(2)}% drift for ${params.vendorId ?? params.tenantId ?? "platform"} on ${params.snapshotDate.toISOString().split("T")[0]}`,
      );
    }

    return { aboveThreshold, snapshot };
  }
}

export default LedgerSnapshotModuleService;
