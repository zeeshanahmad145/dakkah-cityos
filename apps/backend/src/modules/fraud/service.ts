import { MedusaService } from "@medusajs/framework/utils";
import { FraudSignal, FraudRule, FraudCase } from "./models/fraud-signal";

const BLOCK_THRESHOLD = 80;
const FLAG_THRESHOLD = 50;

class FraudModuleService extends MedusaService({
  FraudSignal,
  FraudRule,
  FraudCase,
}) {
  /**
   * Evaluate an order for fraud signals and return composite score + action.
   */
  async evaluateOrder(params: {
    orderId: string;
    customerId: string;
    orderTotal: number;
    cartItemCount: number;
    customerOrderCountLastHour: number;
    couponCode?: string;
    ipCountry?: string;
    billingCountry?: string;
  }): Promise<{
    score: number;
    action: "allow" | "flag" | "block";
    signals: string[];
  }> {
    const signals: string[] = [];
    let score = 0;

    // Velocity check
    if (params.customerOrderCountLastHour > 5) {
      signals.push("velocity");
      score += 30;
    }

    // High value anomaly (> $5000 SAR equivalent)
    if (params.orderTotal > 5000) {
      signals.push("high_value");
      score += 15;
    }

    // Geo mismatch
    if (
      params.ipCountry &&
      params.billingCountry &&
      params.ipCountry !== params.billingCountry
    ) {
      signals.push("geo_mismatch");
      score += 25;
    }

    // Coupon reuse check
    if (params.couponCode) {
      const existing = (await this.listFraudSignals({
        customer_id: params.customerId,
        signal_type: "coupon_abuse",
      })) as any[];
      if (existing.length > 2) {
        signals.push("coupon_abuse");
        score += 30;
      }
    }

    // Persist signals
    for (const signal of signals) {
      await this.createFraudSignals({
        customer_id: params.customerId,
        order_id: params.orderId,
        signal_type: signal,
        score_contribution: score,
      } as any);
    }

    // Create case if threshold exceeded
    let action: "allow" | "flag" | "block" = "allow";
    if (score >= BLOCK_THRESHOLD) {
      action = "block";
      await this.createFraudCases({
        customer_id: params.customerId,
        order_id: params.orderId,
        composite_score: score,
        status: "open",
        action_taken: "blocked",
        signal_ids: signals,
      } as any);
    } else if (score >= FLAG_THRESHOLD) {
      action = "flag";
      await this.createFraudCases({
        customer_id: params.customerId,
        order_id: params.orderId,
        composite_score: score,
        status: "open",
        action_taken: "flagged",
        signal_ids: signals,
      } as any);
    }

    return { score, action, signals };
  }
}

export default FraudModuleService;
