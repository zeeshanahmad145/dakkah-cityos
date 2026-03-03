import { MedusaService } from "@medusajs/framework/utils";
import { RevenueSplitRule } from "./models/revenue-split-rule";
import { createLogger } from "../../lib/logger";

const logger = createLogger("service:revenue-topology");

class RevenueTopologyModuleService extends MedusaService({ RevenueSplitRule }) {
  /**
   * Compute the full revenue split for a transaction amount.
   * Walks the node hierarchy (City → Tenant → Vendor) applying rules in priority order.
   * Returns array of per-tier allocations, ready to post to the ledger.
   */
  async computeSplit(params: {
    grossAmount: number;
    offerType?: string;
    tenantId?: string;
    vendorId?: string;
    currencyCode?: string;
  }): Promise<
    Array<{
      node_id: string;
      label: string;
      amount: number;
      ledger_account_type: string;
      ledger_account_id: string;
      split_type: string;
    }>
  > {
    const { grossAmount, offerType, tenantId, currencyCode = "SAR" } = params;

    // Load all active rules sorted by priority
    const rules = (
      (await this.listRevenueSplitRules({ is_active: true })) as any[]
    ).sort((a: any, b: any) => (a.priority ?? 10) - (b.priority ?? 10));

    const allocations: Array<{
      node_id: string;
      label: string;
      amount: number;
      ledger_account_type: string;
      ledger_account_id: string;
      split_type: string;
    }> = [];

    let remaining = grossAmount;

    for (const rule of rules) {
      // Scope filter
      if (
        rule.applies_to_offer_types &&
        offerType &&
        !(rule.applies_to_offer_types as string[]).includes(offerType)
      )
        continue;

      let amount = 0;
      const base = rule.value_base === "net" ? remaining : grossAmount;

      if (rule.split_type === "percentage") {
        amount = base * (rule.split_value / 100);
      } else if (rule.split_type === "fixed") {
        amount = Math.min(rule.split_value, remaining);
      } else if (rule.split_type === "levy") {
        // Levy is additive — does not reduce remaining (collected from buyer)
        amount = grossAmount * (rule.split_value / 100);
        allocations.push({
          node_id: rule.node_id,
          label: rule.label ?? "levy",
          amount: parseFloat(amount.toFixed(2)),
          ledger_account_type: rule.ledger_account_type,
          ledger_account_id: rule.ledger_account_id,
          split_type: "levy",
        });
        continue;
      } else if (rule.split_type === "residual") {
        amount = remaining;
      }

      amount = Math.max(0, Math.min(amount, remaining));
      remaining -= amount;

      allocations.push({
        node_id: rule.node_id,
        label: rule.label ?? rule.node_id,
        amount: parseFloat(amount.toFixed(2)),
        ledger_account_type: rule.ledger_account_type,
        ledger_account_id: rule.ledger_account_id,
        split_type: rule.split_type,
      });

      if (remaining <= 0) break;
    }

    const totalAllocated = allocations
      .filter((a) => a.split_type !== "levy")
      .reduce((s, a) => s + a.amount, 0);
    logger.info(
      `Revenue split: ${grossAmount} ${currencyCode} → ${allocations.length} allocations, vendor net: ${(grossAmount - totalAllocated).toFixed(2)}`,
    );

    return allocations;
  }
}

export default RevenueTopologyModuleService;
