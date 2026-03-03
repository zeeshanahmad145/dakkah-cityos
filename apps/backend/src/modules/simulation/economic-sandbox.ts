/**
 * Economic Simulation Sandbox
 *
 * A parallel runtime that replays historical commerce data against hypothetical
 * scenarios to compute liquidity exposure, settlement imbalance, and payout freeze
 * impact — without touching production data.
 *
 * Scenarios:
 *   - topology_change:     Revenue split rule changes mid-period
 *   - tax_rule_change:     VAT rate update during active contracts
 *   - vc_revocation:       VC revoked for N% of subscribers
 *   - chargeback_spike:    X% chargeback rate on settlement batch
 *   - vendor_bankruptcy:   Vendor with Y SAR outstanding goes offline
 *   - fleetbase_outage:    All dispatch activities fail for T minutes
 *   - reindex_mismatch:    Search returns stale ABAC-filtered results
 *
 * Output:
 *   - liquidity_exposure_sar
 *   - drift_risk_score (0-1)
 *   - settlement_imbalance_sar
 *   - payout_freeze_impact_sar
 *   - affected_contracts
 *   - recommended_actions
 */

import type { MedusaContainer } from "@medusajs/framework";
import { createLogger } from "../../lib/logger";

const logger = createLogger("simulation:sandbox");

// ─── Scenario Types ──────────────────────────────────────────────────────────

export type SimulationScenario =
  | {
      type: "topology_change";
      new_rule: { node_id: string; platform_pct: number; vendor_pct: number };
    }
  | {
      type: "tax_rule_change";
      old_rate: number;
      new_rate: number;
      effective_date: string;
    }
  | { type: "vc_revocation"; revocation_pct: number; segment: string }
  | { type: "chargeback_spike"; chargeback_pct: number; window_days: number }
  | { type: "vendor_bankruptcy"; vendor_id: string }
  | { type: "fleetbase_outage"; duration_minutes: number }
  | {
      type: "reindex_mismatch";
      stale_ttl_minutes: number;
      affected_offer_types: string[];
    };

export interface SimulationResult {
  scenario_type: string;
  simulated_at: string;
  lookback_days: number;
  liquidity_exposure_sar: number;
  drift_risk_score: number; // 0 = safe, 1 = critical
  settlement_imbalance_sar: number;
  payout_freeze_impact_sar: number;
  refund_liability_sar: number;
  escrow_locked_sar: number;
  affected_contracts: number;
  affected_vendors: number;
  recommended_actions: string[];
  raw_data: Record<string, unknown>;
}

// ─── Main Simulator ──────────────────────────────────────────────────────────

export class EconomicSimulationSandbox {
  constructor(private container: MedusaContainer) {}

  async run(
    scenario: SimulationScenario,
    lookbackDays = 30,
  ): Promise<SimulationResult> {
    logger.info(
      `Simulation: starting ${scenario.type} (${lookbackDays}d lookback)`,
    );
    const base = await this._computeBaseMetrics(lookbackDays);
    let result: Partial<SimulationResult>;

    switch (scenario.type) {
      case "topology_change":
        result = await this._simTopologyChange(base, scenario, lookbackDays);
        break;
      case "tax_rule_change":
        result = await this._simTaxRuleChange(base, scenario, lookbackDays);
        break;
      case "vc_revocation":
        result = await this._simVcRevocation(base, scenario);
        break;
      case "chargeback_spike":
        result = await this._simChargebackSpike(base, scenario, lookbackDays);
        break;
      case "vendor_bankruptcy":
        result = await this._simVendorBankruptcy(base, scenario);
        break;
      case "fleetbase_outage":
        result = await this._simFleetbaseOutage(base, scenario);
        break;
      case "reindex_mismatch":
        result = await this._simReindexMismatch(base, scenario);
        break;
      default:
        throw new Error(`Unknown scenario type: ${(scenario as any).type}`);
    }

    return {
      scenario_type: scenario.type,
      simulated_at: new Date().toISOString(),
      lookback_days: lookbackDays,
      liquidity_exposure_sar: base.total_gross_sar,
      drift_risk_score: 0,
      settlement_imbalance_sar: 0,
      payout_freeze_impact_sar: 0,
      refund_liability_sar: base.refund_liability_sar,
      escrow_locked_sar: base.escrow_locked_sar,
      affected_contracts: 0,
      affected_vendors: 0,
      recommended_actions: [],
      raw_data: base as any,
      ...result,
    };
  }

  // ─── Base metrics from live data (read-only) ────────────────────────────

  private async _computeBaseMetrics(days: number) {
    const ledger = this.container.resolve("ledger") as any;
    const settlement = this.container.resolve("settlement") as any;
    const sub = this.container.resolve("subscription") as any;
    const contract = this.container.resolve("commerceContract") as any;

    const since = new Date(Date.now() - days * 86_400_000).toISOString();

    const [entries, subscriptions, contracts] = await Promise.all([
      ledger
        .listLedgerEntries?.({ created_at: { gte: since } })
        .catch(() => []) as any[],
      sub.listSubscriptions?.({ status: "active" }).catch(() => []) as any[],
      contract
        .listCommerceContracts?.({ status: ["pending", "active"] })
        .catch(() => []) as any[],
    ]);

    const totalGross = entries
      .filter((e: any) => e.account_type === "clearing")
      .reduce((s: number, e: any) => s + (e.credit ?? 0), 0);
    const escrowLocked = entries
      .filter((e: any) => e.account_type === "escrow" && e.status === "frozen")
      .reduce((s: number, e: any) => s + (e.credit ?? 0), 0);
    const pendingPayout = entries
      .filter((e: any) => e.account_type === "payout" && e.status === "posted")
      .reduce((s: number, e: any) => s + (e.credit ?? 0), 0);
    const refunds = entries
      .filter((e: any) => e.account_type === "refund")
      .reduce((s: number, e: any) => s + (e.debit ?? 0), 0);

    return {
      total_gross_sar: totalGross,
      escrow_locked_sar: escrowLocked,
      pending_payout_sar: pendingPayout,
      refund_liability_sar: refunds,
      active_subscriptions: subscriptions.length,
      active_contracts: contracts.length,
      avg_sub_amount_sar:
        subscriptions.reduce(
          (s: number, sub: any) => s + (sub.amount ?? 0),
          0,
        ) / (subscriptions.length || 1),
      entries,
      subscriptions,
      contracts,
    };
  }

  // ─── Scenario implementations ───────────────────────────────────────────

  private async _simTopologyChange(
    base: any,
    scenario: any,
    days: number,
  ): Promise<Partial<SimulationResult>> {
    // Apply new splits to past gross — compute delta
    const appliedEntries = base.entries.filter(
      (e: any) => e.account_type === "clearing",
    );
    const imbalance = appliedEntries.reduce((s: number, e: any) => {
      const gross = e.credit ?? 0;
      const newVendorNet = gross * (scenario.new_rule.vendor_pct / 100);
      const currentVendorNet = gross * 0.85; // assume 85% baseline
      return s + Math.abs(newVendorNet - currentVendorNet);
    }, 0);

    return {
      settlement_imbalance_sar: Math.round(imbalance * 100) / 100,
      drift_risk_score: Math.min(imbalance / (base.total_gross_sar || 1), 1),
      affected_contracts: appliedEntries.length,
      recommended_actions: [
        "Apply retroactive_adjustment_rule on all active contracts before topology update",
        "Freeze payouts for affected vendors until recomputed",
        "Re-run settlement batch after topology migration",
      ],
    };
  }

  private async _simTaxRuleChange(
    base: any,
    scenario: any,
    _days: number,
  ): Promise<Partial<SimulationResult>> {
    const delta = scenario.new_rate - scenario.old_rate; // e.g. 0.05 = 5%
    const taxImpact = base.total_gross_sar * delta;
    return {
      settlement_imbalance_sar: Math.abs(taxImpact),
      drift_risk_score: Math.min(
        Math.abs(taxImpact) / (base.total_gross_sar || 1),
        1,
      ),
      recommended_actions: [
        "Reissue all pending invoices with updated VAT rate",
        "Submit ZATCA adjustment credit notes for pre-effective-date transactions",
        "Re-export tax artifacts to ERPNext with new rate",
      ],
    };
  }

  private async _simVcRevocation(
    base: any,
    scenario: any,
  ): Promise<Partial<SimulationResult>> {
    const affected = Math.round(
      base.active_subscriptions * (scenario.revocation_pct / 100),
    );
    const downgradedRevenue = affected * base.avg_sub_amount_sar * 0.3; // losing 30% revenue uplift
    return {
      liquidity_exposure_sar: downgradedRevenue,
      drift_risk_score: affected / (base.active_subscriptions || 1),
      affected_contracts: affected,
      payout_freeze_impact_sar: downgradedRevenue * 0.85, // vendor share
      recommended_actions: [
        `Re-validate ABAC entitlements for ${affected} subscriptions`,
        "Downgrade pricing tier at next billing cycle for affected customers",
        "Notify vendors of potential revenue reduction",
        "Check search index for offers now visible to ineligible customers",
      ],
    };
  }

  private async _simChargebackSpike(
    base: any,
    scenario: any,
    _days: number,
  ): Promise<Partial<SimulationResult>> {
    const cbAmount = base.total_gross_sar * (scenario.chargeback_pct / 100);
    const freezeImpact = cbAmount * 1.5; // chargebacks freeze 150% of dispute amount
    return {
      settlement_imbalance_sar: cbAmount,
      payout_freeze_impact_sar: freezeImpact,
      drift_risk_score: Math.min(scenario.chargeback_pct / 5, 1), // >5% = critical
      recommended_actions: [
        `Freeze ${scenario.chargeback_pct}% of vendor payouts pending dispute resolution`,
        "Run fraud recomputation job for affected vendor IDs",
        "Alert risk team: chargeback spike exceeds 3% threshold",
        scenario.chargeback_pct > 5
          ? "CRITICAL: Consider temporary payout suspension"
          : "Monitor for 48h",
      ],
    };
  }

  private async _simVendorBankruptcy(
    base: any,
    scenario: any,
  ): Promise<Partial<SimulationResult>> {
    const ledger = this.container.resolve("ledger") as any;
    const vendorEntries: any[] =
      (await ledger
        .listLedgerEntries?.({
          account_type: "vendor",
          account_id: scenario.vendor_id,
          status: "posted",
        })
        .catch(() => [])) ?? [];
    const exposure = vendorEntries.reduce(
      (s: number, e: any) => s + (e.credit ?? 0),
      0,
    );
    const escrowAtRisk = base.escrow_locked_sar * 0.1; // rough estimate 10% tied to bankrupt vendor

    return {
      payout_freeze_impact_sar: exposure,
      escrow_locked_sar: base.escrow_locked_sar + escrowAtRisk,
      drift_risk_score: Math.min(exposure / (base.total_gross_sar || 1), 1),
      affected_vendors: 1,
      recommended_actions: [
        `Freeze all payouts for vendor ${scenario.vendor_id} immediately`,
        `Identify ${vendorEntries.length} affected ledger entries`,
        "Trigger escrow hold for all active contracts with this vendor",
        "Notify affected customers and initiate refund reserve",
        "File for ZATCA adjustment on tax claims",
      ],
    };
  }

  private async _simFleetbaseOutage(
    base: any,
    scenario: any,
  ): Promise<Partial<SimulationResult>> {
    const activeDispatch = base.contracts.filter(
      (c: any) =>
        c.execution_engine === "dispatch" ||
        c.metadata?.workflow === "on_demand_dispatch",
    );
    const exposure = activeDispatch.reduce(
      (s: number, c: any) => s + (c.total_amount ?? 0),
      0,
    );
    const slaBreaches = Math.round(
      activeDispatch.length * (scenario.duration_minutes / 30),
    ); // 1 breach per 30min per order
    return {
      liquidity_exposure_sar: exposure,
      affected_contracts: activeDispatch.length,
      drift_risk_score: Math.min(scenario.duration_minutes / 60, 1),
      recommended_actions: [
        `${activeDispatch.length} active dispatch orders at risk`,
        `Estimated ${slaBreaches} SLA breaches if outage continues`,
        "Activate fallback dispatch routing (manual assignment)",
        "Emit customer ETA extension notifications",
        scenario.duration_minutes > 15
          ? "Auto-refund SLA compensation credits"
          : "Monitor",
      ],
    };
  }

  private async _simReindexMismatch(
    base: any,
    scenario: any,
  ): Promise<Partial<SimulationResult>> {
    // Estimate offers where stale ABAC could allow unauthorized access
    const staleRatio = Math.min(scenario.stale_ttl_minutes / 60, 0.5); // up to 50% stale
    const atRisk = Math.round(base.active_contracts * staleRatio);
    return {
      affected_contracts: atRisk,
      drift_risk_score: staleRatio,
      recommended_actions: [
        "Confirm identity-gate re-checks eligibility at checkout (search is NOT authoritative)",
        `Trigger immediate reindex for offer types: ${scenario.affected_offer_types.join(", ")}`,
        "Set ABAC filterable-attributes cache TTL to ≤5min",
        "Add checkout eligibility fence in policy-engine route handlers",
      ],
    };
  }
}

// ─── Convenience function ────────────────────────────────────────────────────

export async function runSimulation(
  container: MedusaContainer,
  scenario: SimulationScenario,
  lookbackDays = 30,
): Promise<SimulationResult> {
  return new EconomicSimulationSandbox(container).run(scenario, lookbackDays);
}
