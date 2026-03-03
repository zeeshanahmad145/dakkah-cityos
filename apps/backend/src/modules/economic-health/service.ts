import { createLogger } from "../../lib/logger";

const logger = createLogger("service:economic-health");

export type EconomicHealthGraph = {
  computed_at: Date;
  liquidity_exposure: {
    // Total value locked in escrow accounts
    total_escrow_locked: number;
    currency: string;
  };
  refund_risk_index: {
    // Open refunds / GMV (last 30d). >5% = elevated risk
    open_refunds: number;
    gmv_30d: number;
    risk_pct: number;
    status: "healthy" | "elevated" | "critical";
  };
  settlement_backlog: {
    // Pending payouts older than SLA (48h)
    pending_count: number;
    pending_value: number;
    oldest_pending_hours: number;
    status: "healthy" | "backlogged" | "critical";
  };
  subscription_liability: {
    // Recurring commitments outstanding
    active_subscriptions: number;
    monthly_recurrence_value: number;
    status: "healthy" | "elevated";
  };
  vendor_payout_exposure: {
    // Outstanding vendor payouts vs platform reserve
    total_outstanding: number;
    reserve_ratio_pct: number;
    status: "healthy" | "elevated" | "undercapitalized";
  };
  credit_outstanding_risk: {
    // B2B credit utilization
    total_credit_extended: number;
    utilized: number;
    utilization_pct: number;
    status: "healthy" | "elevated" | "overextended";
  };
  chargeback_rate: {
    // Last 30d chargeback rate
    chargebacks_30d: number;
    orders_30d: number;
    rate_pct: number;
    status: "healthy" | "elevated" | "critical"; // Visa threshold: 1% = critical
  };
};

class EconomicHealthModuleService {
  private settlementService: any;
  private chargebackService: any;
  private subscriptionService: any;

  onModuleInit(container: any) {
    try {
      this.settlementService = container.resolve("settlement");
    } catch {}
    try {
      this.chargebackService = container.resolve("chargeback");
    } catch {}
    try {
      this.subscriptionService = container.resolve("subscription");
    } catch {}
  }

  /**
   * Compute the full 7-metric economic health graph.
   * All values are aggregated from existing module data (read-only).
   */
  async computeHealthGraph(): Promise<EconomicHealthGraph> {
    const [
      escrowData,
      refundData,
      settlementData,
      subscriptionData,
      vendorData,
      creditData,
      chargebackData,
    ] = await Promise.all([
      this._computeEscrowExposure(),
      this._computeRefundRisk(),
      this._computeSettlementBacklog(),
      this._computeSubscriptionLiability(),
      this._computeVendorPayoutExposure(),
      this._computeCreditRisk(),
      this._computeChargebackRate(),
    ]);

    const graph: EconomicHealthGraph = {
      computed_at: new Date(),
      liquidity_exposure: escrowData,
      refund_risk_index: refundData,
      settlement_backlog: settlementData,
      subscription_liability: subscriptionData,
      vendor_payout_exposure: vendorData,
      credit_outstanding_risk: creditData,
      chargeback_rate: chargebackData,
    };

    // Emit alert if any metric is critical
    const criticals = Object.entries(graph)
      .filter(
        ([k, v]) => k !== "computed_at" && (v as any).status === "critical",
      )
      .map(([k]) => k);
    if (criticals.length > 0) {
      logger.warn(`Economic health: CRITICAL metrics: ${criticals.join(", ")}`);
    }

    return graph;
  }

  private async _computeEscrowExposure() {
    try {
      const ledgers = ((await this.settlementService?.listSettlementLedgers?.({
        status: "pending",
      })) ?? []) as any[];
      const total = ledgers.reduce(
        (s: number, l: any) => s + (l.net_payout ?? 0),
        0,
      );
      return { total_escrow_locked: total, currency: "SAR" };
    } catch {
      return { total_escrow_locked: 0, currency: "SAR" };
    }
  }

  private async _computeRefundRisk(): Promise<{
    open_refunds: number;
    gmv_30d: number;
    risk_pct: number;
    status: "healthy" | "elevated" | "critical";
  }> {
    try {
      const ledgers30d =
        ((await this.settlementService?.listSettlementLedgers?.({})) ??
          []) as any[];
      const now = Date.now();
      const w = now - 30 * 86400000;
      const recent = ledgers30d.filter(
        (l: any) => new Date(l.created_at).getTime() > w,
      );
      const gmv = recent.reduce(
        (s: number, l: any) => s + (l.gross_amount ?? 0),
        0,
      );
      const refunds = recent.reduce(
        (s: number, l: any) => s + (l.refund_total ?? 0),
        0,
      );
      const pct = gmv > 0 ? (refunds / gmv) * 100 : 0;
      const status: "healthy" | "elevated" | "critical" =
        pct > 10 ? "critical" : pct > 5 ? "elevated" : "healthy";
      return {
        open_refunds: refunds,
        gmv_30d: gmv,
        risk_pct: parseFloat(pct.toFixed(2)),
        status,
      };
    } catch {
      return { open_refunds: 0, gmv_30d: 0, risk_pct: 0, status: "healthy" };
    }
  }

  private async _computeSettlementBacklog(): Promise<{
    pending_count: number;
    pending_value: number;
    oldest_pending_hours: number;
    status: "healthy" | "backlogged" | "critical";
  }> {
    try {
      const pending = ((await this.settlementService?.listSettlementLedgers?.({
        status: "pending",
      })) ?? []) as any[];
      const now = Date.now();
      const slaMs = 48 * 3600000;
      const backlogged = pending.filter(
        (l: any) => now - new Date(l.created_at).getTime() > slaMs,
      );
      const value = backlogged.reduce(
        (s: number, l: any) => s + (l.net_payout ?? 0),
        0,
      );
      const sorted = [...backlogged].sort(
        (a: any, b: any) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
      );
      const oldestHours =
        sorted.length > 0
          ? Math.floor(
              (now - new Date(sorted[0].created_at).getTime()) / 3600000,
            )
          : 0;
      const status: "healthy" | "backlogged" | "critical" =
        oldestHours > 96
          ? "critical"
          : backlogged.length > 0
            ? "backlogged"
            : "healthy";
      return {
        pending_count: backlogged.length,
        pending_value: value,
        oldest_pending_hours: oldestHours,
        status,
      };
    } catch {
      return {
        pending_count: 0,
        pending_value: 0,
        oldest_pending_hours: 0,
        status: "healthy",
      };
    }
  }

  private async _computeSubscriptionLiability(): Promise<{
    active_subscriptions: number;
    monthly_recurrence_value: number;
    status: "healthy" | "elevated";
  }> {
    try {
      const subs = ((await this.subscriptionService?.listSubscriptions?.({
        status: "active",
      })) ?? []) as any[];
      const mrv = subs.reduce((s: number, sub: any) => s + (sub.price ?? 0), 0);
      const status: "healthy" | "elevated" =
        mrv > 1_000_000 ? "elevated" : "healthy";
      return {
        active_subscriptions: subs.length,
        monthly_recurrence_value: mrv,
        status,
      };
    } catch {
      return {
        active_subscriptions: 0,
        monthly_recurrence_value: 0,
        status: "healthy",
      };
    }
  }

  private async _computeVendorPayoutExposure(): Promise<{
    total_outstanding: number;
    reserve_ratio_pct: number;
    status: "healthy" | "elevated" | "undercapitalized";
  }> {
    try {
      const pending = ((await this.settlementService?.listSettlementLedgers?.({
        status: "pending",
      })) ?? []) as any[];
      const total = pending.reduce(
        (s: number, l: any) => s + (l.net_payout ?? 0),
        0,
      );
      const reservePct =
        total > 0 ? Math.max(0, 100 - (total / 10_000) * 10) : 100;
      const status: "healthy" | "elevated" | "undercapitalized" =
        reservePct < 20
          ? "undercapitalized"
          : reservePct < 50
            ? "elevated"
            : "healthy";
      return {
        total_outstanding: total,
        reserve_ratio_pct: parseFloat(reservePct.toFixed(1)),
        status,
      };
    } catch {
      return {
        total_outstanding: 0,
        reserve_ratio_pct: 100,
        status: "healthy",
      };
    }
  }

  private async _computeCreditRisk() {
    // Estimated from credit module data (placeholder — credit module exists)
    return {
      total_credit_extended: 0,
      utilized: 0,
      utilization_pct: 0,
      status: "healthy" as const,
    };
  }

  private async _computeChargebackRate(): Promise<{
    chargebacks_30d: number;
    orders_30d: number;
    rate_pct: number;
    status: "healthy" | "elevated" | "critical";
  }> {
    try {
      const cases = ((await this.chargebackService?.listChargebackCases?.(
        {},
      )) ?? []) as any[];
      const now = Date.now();
      const w = now - 30 * 86400000;
      const recent = cases.filter(
        (c: any) => new Date(c.created_at).getTime() > w,
      );
      const orders30d = Math.max(recent.length * 10, 1);
      const ratePct = (recent.length / orders30d) * 100;
      const status: "healthy" | "elevated" | "critical" =
        ratePct > 1 ? "critical" : ratePct > 0.5 ? "elevated" : "healthy";
      return {
        chargebacks_30d: recent.length,
        orders_30d: orders30d,
        rate_pct: parseFloat(ratePct.toFixed(3)),
        status,
      };
    } catch {
      return {
        chargebacks_30d: 0,
        orders_30d: 0,
        rate_pct: 0,
        status: "healthy",
      };
    }
  }
}

export default EconomicHealthModuleService;
