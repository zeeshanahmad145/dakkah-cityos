import { MedusaService } from "@medusajs/framework/utils";
import { ReturnRequest } from "./models/return-request";
import {
  RmaInspection,
  RestockingFeeRule,
  ExchangeOrder,
} from "./models/rma-inspection";

class RmaModuleService extends MedusaService({
  ReturnRequest,
  RmaInspection,
  RestockingFeeRule,
  ExchangeOrder,
}) {
  /**
   * Check if an order is eligible for return based on vendor restocking rules.
   */
  async checkEligibility(
    orderId: string,
    vendorId: string | null,
    deliveredAt: Date,
    returnType: string = "return",
  ): Promise<{ eligible: boolean; reason?: string; expiresAt?: Date }> {
    // Find applicable rule
    const rules = (await this.listRestockingFeeRules({
      vendor_id: vendorId,
      is_active: true,
    })) as any[];

    const rule = rules[0];
    const maxDays = rule?.max_days_after_delivery ?? 30;
    const expiresAt = new Date(deliveredAt.getTime() + maxDays * 86400000);

    if (new Date() > expiresAt) {
      return {
        eligible: false,
        reason: `Return window of ${maxDays} days has expired`,
      };
    }

    return { eligible: true, expiresAt };
  }

  /**
   * Calculate restocking fee for a return.
   */
  async calculateRestockingFee(
    vendorId: string | null,
    orderTotal: number,
    condition: string,
  ): Promise<number> {
    const rules = (await this.listRestockingFeeRules({
      vendor_id: vendorId,
      is_active: true,
    })) as any[];
    const rule = rules.find(
      (r: any) => r.applies_if === "always" || r.applies_if === condition,
    );
    if (!rule) return 0;

    return rule.fee_type === "percentage"
      ? orderTotal * (rule.fee_value / 100)
      : rule.fee_value;
  }

  /**
   * Approve a return request after inspection.
   */
  async approveReturn(
    returnRequestId: string,
    refundAmount: number,
    restockingFee: number = 0,
  ): Promise<any> {
    const finalRefund = Math.max(0, refundAmount - restockingFee);
    return this.updateReturnRequests({
      id: returnRequestId,
      status: "approved",
      refund_amount: finalRefund,
      approved_at: new Date(),
    } as any);
  }
}

export default RmaModuleService;
