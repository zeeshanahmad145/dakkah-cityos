/**
 * SimulationModuleService — Read-only economic impact simulation.
 *
 * IMPORTANT: This service NEVER writes to the database.
 * All methods are pure "what-if" computations that read from existing module data
 * and return a preview of what would happen if the action were committed.
 *
 * Use before committing: refunds, subscription upgrades, bundle pricing, settlement.
 */
import { createLogger } from "../../lib/logger";

const logger = createLogger("service:simulation");

export type SimulationLineItem = {
  label: string;
  amount: number;
  type: "credit" | "debit" | "levy" | "neutral";
  account?: string;
};

export type SimulationResult = {
  preview: {
    line_items: SimulationLineItem[];
    totals: Record<string, number>;
  };
  warnings: string[];
  confidence: "exact" | "estimated";
};

class SimulationModuleService {
  private settlementService: any;
  private loyaltyService: any;
  private commissionService: any;
  private pricingService: any;

  onModuleInit(container: any) {
    try {
      this.settlementService = container.resolve("settlement");
    } catch {}
    try {
      this.loyaltyService = container.resolve("loyalty");
    } catch {}
    try {
      this.commissionService = container.resolve("commission");
    } catch {}
    try {
      this.pricingService = container.resolve("pricingResolver");
    } catch {}
  }

  /**
   * Simulate the financial impact of a full refund on an order.
   * Returns: refund breakdown, commission clawback, loyalty reversal, ERP impact preview.
   */
  async simulateRefund(params: {
    orderId: string;
    refundAmount: number;
    currencyCode?: string;
  }): Promise<SimulationResult> {
    const lineItems: SimulationLineItem[] = [];
    const warnings: string[] = [];

    lineItems.push({
      label: "Refund to customer",
      amount: params.refundAmount,
      type: "debit",
      account: "wallet",
    });

    // Estimate commission clawback (~15% unless we have real data)
    const commissionEst = params.refundAmount * 0.15;
    lineItems.push({
      label: "Platform commission reversal",
      amount: -commissionEst,
      type: "credit",
      account: "commission",
    });

    // Loyalty reversal estimate
    const loyaltyEst = Math.floor(params.refundAmount * 0.01);
    if (loyaltyEst > 0) {
      lineItems.push({
        label: "Loyalty points deducted",
        amount: loyaltyEst,
        type: "debit",
        account: "loyalty",
      });
    }

    warnings.push(
      "Commission and loyalty amounts are estimates. Actual values depend on original order commission rate.",
    );

    return {
      preview: {
        line_items: lineItems,
        totals: {
          gross_refund: params.refundAmount,
          net_clawback: commissionEst + loyaltyEst,
          net_to_customer: params.refundAmount,
        },
      },
      warnings,
      confidence: "estimated",
    };
  }

  /**
   * Simulate upgrading a subscription from one plan to another.
   * Returns: proration credit, new recurring charge, benefit delta.
   */
  async simulateUpgrade(params: {
    customerId: string;
    fromPlanId: string;
    toPlanId: string;
    fromPrice: number;
    toPrice: number;
    remainingDays: number;
    totalDays: number;
  }): Promise<SimulationResult> {
    const proratedCredit =
      params.fromPrice * (params.remainingDays / params.totalDays);
    const upgradeCost = params.toPrice - proratedCredit;
    const lineItems: SimulationLineItem[] = [
      {
        label: `Prorated credit from ${params.fromPlanId}`,
        amount: proratedCredit,
        type: "credit",
      },
      {
        label: `New plan charge: ${params.toPlanId}`,
        amount: params.toPrice,
        type: "debit",
      },
      {
        label: "Net upgrade payment",
        amount: Math.max(0, upgradeCost),
        type: "neutral",
      },
    ];

    return {
      preview: {
        line_items: lineItems,
        totals: {
          prorated_credit: proratedCredit,
          net_charge: Math.max(0, upgradeCost),
        },
      },
      warnings:
        upgradeCost < 0
          ? ["Customer will receive a wallet credit for the overpayment."]
          : [],
      confidence: "exact",
    };
  }

  /**
   * Simulate composite bundle pricing (multiple offer IDs with discount rules).
   */
  async simulateBundlePrice(params: {
    offerIds: string[];
    prices: number[];
    discountRules: Array<{
      type: "pct" | "fixed";
      value: number;
      label: string;
    }>;
    currencyCode?: string;
  }): Promise<SimulationResult> {
    const subtotal = params.prices.reduce((s, p) => s + p, 0);
    let net = subtotal;
    const lineItems: SimulationLineItem[] = params.prices.map((p, i) => ({
      label: `Offer ${params.offerIds[i] ?? i + 1}`,
      amount: p,
      type: "debit",
    }));

    for (const rule of params.discountRules) {
      const disc =
        rule.type === "pct" ? subtotal * (rule.value / 100) : rule.value;
      net -= disc;
      lineItems.push({ label: rule.label, amount: -disc, type: "credit" });
    }

    return {
      preview: {
        line_items: lineItems,
        totals: {
          subtotal,
          net_price: Math.max(0, net),
          total_discount: subtotal - Math.max(0, net),
        },
      },
      warnings:
        net < 0
          ? ["Bundle is over-discounted and results in a negative price."]
          : [],
      confidence: "exact",
    };
  }

  /**
   * Preview the settlement payout for a vendor before committing.
   */
  async simulateSettlement(params: {
    vendorId: string;
    grossRevenue: number;
    commissionPct?: number;
    taxPct?: number;
    refundsTotal?: number;
    currencyCode?: string;
  }): Promise<SimulationResult> {
    const commission =
      params.grossRevenue * ((params.commissionPct ?? 15) / 100);
    const refunds = params.refundsTotal ?? 0;
    const tax =
      (params.grossRevenue - commission - refunds) *
      ((params.taxPct ?? 0) / 100);
    const net = params.grossRevenue - commission - refunds - tax;

    const lineItems: SimulationLineItem[] = [
      { label: "Gross revenue", amount: params.grossRevenue, type: "neutral" },
      { label: "Platform commission", amount: -commission, type: "credit" },
      { label: "Refunds deducted", amount: -refunds, type: "credit" },
      ...(tax > 0
        ? [{ label: "Tax withholding", amount: -tax, type: "credit" as const }]
        : []),
      { label: "Net vendor payout", amount: net, type: "neutral" },
    ];

    return {
      preview: {
        line_items: lineItems,
        totals: { gross: params.grossRevenue, commission, refunds, tax, net },
      },
      warnings:
        net < 0
          ? [
              "Settlement results in a negative balance — vendor owes the platform.",
            ]
          : [],
      confidence: "estimated",
    };
  }
}

export default SimulationModuleService;
