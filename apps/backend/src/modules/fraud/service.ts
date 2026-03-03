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

  /**
   * Detect vendor behavioral anomalies (review manipulation, return fraud, listing abuse).
   * Returns a risk score 0-100 and flagged signals.
   */
  async scoreVendorBehavior(vendorId: string): Promise<{
    score: number;
    signals: string[];
    action: "clear" | "flag" | "suspend";
  }> {
    const signals: string[] = [];
    let score = 0;

    // Review velocity: count signals for this vendor in last 7 days
    const recentSignals = (await this.listFraudSignals({
      vendor_id: vendorId,
    })) as any[];
    const last7days = new Date(Date.now() - 7 * 86400000);
    const recentReviewSignals = recentSignals.filter(
      (s: any) =>
        s.signal_type === "review_velocity" &&
        new Date(s.created_at) > last7days,
    );

    if (recentReviewSignals.length > 10) {
      signals.push("review_velocity_spike");
      score += 40;
    }

    // Return abuse: high refund rate signals
    const returnAbuse = recentSignals.filter(
      (s: any) => s.signal_type === "return_abuse",
    );
    if (returnAbuse.length > 5) {
      signals.push("return_abuse_pattern");
      score += 30;
    }

    // Listing price manipulation signals
    const priceManipulation = recentSignals.filter(
      (s: any) => s.signal_type === "price_manipulation",
    );
    if (priceManipulation.length > 3) {
      signals.push("price_manipulation_suspected");
      score += 30;
    }

    const action = score >= 70 ? "suspend" : score >= 40 ? "flag" : "clear";

    if (score >= 40) {
      await this.createFraudCases({
        vendor_id: vendorId,
        composite_score: score,
        status: "open",
        action_taken: action,
        signal_ids: signals,
        case_type: "vendor_behavior",
      } as any);
    }

    return { score, signals, action };
  }

  /**
   * Detect promotion/coupon abuse across accounts.
   * Flags multi-account usage of the same promotion.
   */
  async scorePromotionUsage(promotionId: string): Promise<{
    score: number;
    signals: string[];
    unique_customers: number;
    flagged: boolean;
  }> {
    const signals: string[] = [];
    let score = 0;

    const promoSignals = (await this.listFraudSignals({
      signal_type: "promotion_abuse",
      promotion_id: promotionId,
    })) as any[];

    // Count unique customers using this promo
    const uniqueCustomers = new Set(promoSignals.map((s: any) => s.customer_id))
      .size;

    if (uniqueCustomers > 20) {
      signals.push("mass_promotion_abuse");
      score += 50;
    }

    // Detect same device/IP across customers
    const ipGroups = new Map<string, number>();
    for (const s of promoSignals) {
      if (s.metadata?.ip) {
        ipGroups.set(s.metadata.ip, (ipGroups.get(s.metadata.ip) ?? 0) + 1);
      }
    }
    const sharedIps = [...ipGroups.values()].filter((c) => c > 3).length;
    if (sharedIps > 0) {
      signals.push("shared_ip_promotion_abuse");
      score += 40;
    }

    return {
      score,
      signals,
      unique_customers: uniqueCustomers,
      flagged: score >= 40,
    };
  }

  /**
   * Detect buyer behavioral anomalies (rapid checkout+refund cycling, chargeback farming).
   */
  async scoreBuyerAnomaly(customerId: string): Promise<{
    score: number;
    signals: string[];
    action: "allow" | "flag" | "block";
  }> {
    const signals: string[] = [];
    let score = 0;

    const buyerSignals = (await this.listFraudSignals({
      customer_id: customerId,
    })) as any[];
    const last30days = new Date(Date.now() - 30 * 86400000);
    const recent = buyerSignals.filter(
      (s: any) => new Date(s.created_at) > last30days,
    );

    // Rapid refund cycling
    const refundSignals = recent.filter(
      (s: any) => s.signal_type === "rapid_refund",
    );
    if (refundSignals.length > 3) {
      signals.push("rapid_refund_cycling");
      score += 35;
    }

    // Chargeback pattern
    const chargebackSignals = recent.filter(
      (s: any) => s.signal_type === "chargeback",
    );
    if (chargebackSignals.length > 2) {
      signals.push("chargeback_farming");
      score += 45;
    }

    // Account multiple addresses
    const addressSignals = recent.filter(
      (s: any) => s.signal_type === "address_cycling",
    );
    if (addressSignals.length > 5) {
      signals.push("address_cycling");
      score += 20;
    }

    const action =
      score >= BLOCK_THRESHOLD
        ? "block"
        : score >= FLAG_THRESHOLD
          ? "flag"
          : "allow";

    if (score >= FLAG_THRESHOLD) {
      await this.createFraudCases({
        customer_id: customerId,
        composite_score: score,
        status: "open",
        action_taken: action,
        signal_ids: signals,
        case_type: "buyer_anomaly",
      } as any);
    }

    return { score, signals, action };
  }
}

export default FraudModuleService;
