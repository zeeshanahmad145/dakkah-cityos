/**
 * Economic Health — Simulation API
 *
 * POST /admin/custom/economic-health/simulate
 *   { scenario: { type: "...", ...params } }
 *   Returns SimulationResult
 *
 * GET /admin/custom/economic-health/metrics
 *   Returns base metrics for the observability dashboard
 *   (liquidity exposure, vendor risk heatmap, subscription liability)
 */
import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import {
  runSimulation,
  type SimulationScenario,
} from "../../../../../modules/simulation/economic-sandbox";
import { createLogger } from "../../../../../lib/logger";

const logger = createLogger("api:economic-health");

// ─── GET /admin/custom/economic-health/metrics ───────────────────────────────
export async function GET(
  req: MedusaRequest,
  res: MedusaResponse,
): Promise<void> {
  const container = req.scope;

  try {
    const ledger = container.resolve("ledger") as any;
    const settlement = container.resolve("settlement") as any;
    const sub = container.resolve("subscription") as any;

    const since30d = new Date(Date.now() - 30 * 86_400_000).toISOString();

    const [entries, subscriptions] = await Promise.all([
      ledger
        .listLedgerEntries?.({ created_at: { gte: since30d } })
        .catch(() => []) as any[],
      sub.listSubscriptions?.({ status: "active" }).catch(() => []) as any[],
    ]);

    const total_gross_sar = entries
      .filter((e: any) => e.account_type === "clearing")
      .reduce((s: number, e: any) => s + (e.credit ?? 0), 0);
    const escrow_locked_sar = entries
      .filter((e: any) => e.account_type === "escrow" && e.status === "frozen")
      .reduce((s: number, e: any) => s + (e.credit ?? 0), 0);
    const pending_payout_sar = entries
      .filter((e: any) => e.account_type === "payout" && e.status === "posted")
      .reduce((s: number, e: any) => s + (e.credit ?? 0), 0);
    const refund_liability_sar = entries
      .filter((e: any) => e.account_type === "refund")
      .reduce((s: number, e: any) => s + (e.debit ?? 0), 0);

    // Vendor risk: group payout entries by vendor, compute chargeback ratio
    const vendorMap: Record<string, { pending: number; chargebacks: number }> =
      {};
    for (const e of entries) {
      if (e.account_type === "vendor") {
        const v = (vendorMap[e.account_id] ??= { pending: 0, chargebacks: 0 });
        v.pending += e.credit ?? 0;
      }
      if (e.account_type === "chargeback" && e.reference_type === "vendor") {
        const v = (vendorMap[e.reference_id] ??= {
          pending: 0,
          chargebacks: 0,
        });
        v.chargebacks += e.debit ?? 0;
      }
    }
    const vendor_risk = Object.entries(vendorMap)
      .map(([vendor_id, d]) => ({
        vendor_id,
        pending_sar: d.pending,
        cb_pct: d.pending > 0 ? (d.chargebacks / d.pending) * 100 : 0,
        risk_score: Math.min((d.chargebacks / (d.pending || 1)) * 5, 1),
      }))
      .sort((a, b) => b.risk_score - a.risk_score)
      .slice(0, 20);

    res.json({
      total_gross_sar,
      escrow_locked_sar,
      pending_payout_sar,
      refund_liability_sar,
      active_subscriptions: subscriptions.length,
      avg_sub_amount_sar:
        subscriptions.reduce(
          (s: number, sub: any) => s + (sub.amount ?? 0),
          0,
        ) / (subscriptions.length || 1),
      vendor_risk,
      as_of: new Date().toISOString(),
    });
  } catch (err: any) {
    logger.error("economic-health metrics error:", err.message);
    res.json({
      total_gross_sar: 0,
      escrow_locked_sar: 0,
      pending_payout_sar: 0,
      refund_liability_sar: 0,
      active_subscriptions: 0,
      vendor_risk: [],
    });
  }
}

// ─── POST /admin/custom/economic-health/simulate ─────────────────────────────
export async function POST(
  req: MedusaRequest,
  res: MedusaResponse,
): Promise<void> {
  const { scenario, lookback_days = 30 } = req.body as {
    scenario: SimulationScenario;
    lookback_days?: number;
  };

  if (!scenario?.type) {
    res.status(400).json({ error: "scenario.type is required" });
    return;
  }

  try {
    const result = await runSimulation(req.scope, scenario, lookback_days);
    res.json(result);
  } catch (err: any) {
    logger.error("simulation error:", err.message);
    res.status(500).json({ error: err.message });
  }
}
