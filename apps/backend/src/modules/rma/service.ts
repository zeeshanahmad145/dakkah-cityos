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
   * Apply the outcome of a physical inspection to a return request.
   * Disposition routing:
   *   "good"             → restock (no fee), full refund
   *   "damaged"          → apply restocking fee, partial refund
   *   "unsellable"       → vendor return or scrap, no refund
   *   "trade_in_accept"  → update trade-in offer, partial credit
   *   "warranty_repair"  → route to repair workflow
   *   "warranty_replace" → issue replacement order
   */
  async applyInspectionOutcome(
    returnRequestId: string,
    outcome:
      | "good"
      | "damaged"
      | "unsellable"
      | "trade_in_accept"
      | "warranty_repair"
      | "warranty_replace",
    details: {
      adjustedValue?: number; // for trade_in_accept
      restockingFeePercent?: number; // for damaged
      eventBus?: any;
    } = {},
  ): Promise<any> {
    const returnRequest = (await this.retrieveReturnRequest(
      returnRequestId,
    )) as any;

    switch (outcome) {
      case "good": {
        // Full restock — no fee, full refund approved
        await this.updateReturnRequests({
          id: returnRequestId,
          disposition: "restocked",
          restocking_fee_amount: 0,
          status: "approved",
          approved_at: new Date(),
        } as any);
        await details.eventBus?.emit?.("rma.disposition.restock", {
          return_request_id: returnRequestId,
        });
        break;
      }
      case "damaged": {
        const fee =
          returnRequest.refund_amount *
          ((details.restockingFeePercent ?? 20) / 100);
        const netRefund = Math.max(0, returnRequest.refund_amount - fee);
        await this.updateReturnRequests({
          id: returnRequestId,
          disposition: "partial_refund",
          restocking_fee_amount: fee,
          refund_amount: netRefund,
          status: "approved",
          approved_at: new Date(),
        } as any);
        await details.eventBus?.emit?.("rma.disposition.partial_refund", {
          return_request_id: returnRequestId,
          net_refund: netRefund,
          fee,
        });
        break;
      }
      case "unsellable": {
        await this.updateReturnRequests({
          id: returnRequestId,
          disposition: "scrap",
          refund_amount: 0,
          status: "closed",
        } as any);
        await details.eventBus?.emit?.("rma.disposition.scrap", {
          return_request_id: returnRequestId,
        });
        break;
      }
      case "trade_in_accept": {
        await this.updateReturnRequests({
          id: returnRequestId,
          disposition: "trade_in",
          refund_amount: details.adjustedValue ?? 0,
          status: "approved",
          approved_at: new Date(),
        } as any);
        await details.eventBus?.emit?.("rma.disposition.trade_in", {
          return_request_id: returnRequestId,
          adjusted_value: details.adjustedValue,
        });
        break;
      }
      case "warranty_repair": {
        await this.updateReturnRequests({
          id: returnRequestId,
          disposition: "repair",
          status: "in_progress",
        } as any);
        await details.eventBus?.emit?.("rma.disposition.warranty_repair", {
          return_request_id: returnRequestId,
        });
        break;
      }
      case "warranty_replace": {
        await this.updateReturnRequests({
          id: returnRequestId,
          disposition: "replace",
          status: "in_progress",
        } as any);
        await details.eventBus?.emit?.("rma.disposition.warranty_replace", {
          return_request_id: returnRequestId,
        });
        break;
      }
    }

    return this.retrieveReturnRequest(returnRequestId);
  }
}

export default RmaModuleService;
