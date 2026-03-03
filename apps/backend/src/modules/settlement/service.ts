import { MedusaService } from "@medusajs/framework/utils";
import {
  SettlementLedger,
  SettlementLine,
  SettlementReversal,
} from "./models/settlement-ledger";
import { SettlementPayoutLine } from "./models/settlement-payout-line";

class SettlementModuleService extends MedusaService({
  SettlementLedger,
  SettlementLine,
  SettlementReversal,
  SettlementPayoutLine,
}) {
  /**
   * Create a settlement ledger for a completed order with multi-party lines.
   */
  async settleOrder(params: {
    orderId: string;
    grossAmount: number;
    platformFeeRate: number; // e.g. 0.05 = 5%
    vendorId?: string;
    affiliateId?: string;
    ambassadorId?: string;
    affiliateRate?: number;
    ambassadorRate?: number;
    taxAmount?: number;
    currencyCode?: string;
  }): Promise<any> {
    const {
      orderId,
      grossAmount,
      platformFeeRate,
      vendorId,
      affiliateId,
      ambassadorId,
      affiliateRate = 0,
      ambassadorRate = 0,
      taxAmount = 0,
      currencyCode = "SAR",
    } = params;

    const platformFee = grossAmount * platformFeeRate;
    const affiliateCommission = grossAmount * affiliateRate;
    const ambassadorCommission = grossAmount * ambassadorRate;
    const vendorNet =
      grossAmount -
      platformFee -
      affiliateCommission -
      ambassadorCommission -
      taxAmount;
    const netPayout = Math.max(0, vendorNet);

    const ledger = await this.createSettlementLedgers({
      order_id: orderId,
      status: "pending",
      gross_amount: grossAmount,
      platform_fee: platformFee,
      vendor_net: vendorNet,
      affiliate_commission: affiliateCommission,
      ambassador_commission: ambassadorCommission,
      tax_collected: taxAmount,
      net_payout: netPayout,
      currency_code: currencyCode,
    } as any);

    // Create lines
    const lines: any[] = [
      {
        ledger_id: ledger.id,
        party_type: "platform",
        party_id: null,
        direction: "credit",
        amount: platformFee,
        currency_code: currencyCode,
        status: "pending",
      },
    ];
    if (vendorId) {
      lines.push({
        ledger_id: ledger.id,
        party_type: "vendor",
        party_id: vendorId,
        direction: "credit",
        amount: netPayout,
        currency_code: currencyCode,
        status: "pending",
      });
    }
    if (affiliateId && affiliateCommission > 0) {
      lines.push({
        ledger_id: ledger.id,
        party_type: "affiliate",
        party_id: affiliateId,
        direction: "credit",
        amount: affiliateCommission,
        currency_code: currencyCode,
        status: "pending",
      });
    }
    if (ambassadorId && ambassadorCommission > 0) {
      lines.push({
        ledger_id: ledger.id,
        party_type: "ambassador",
        party_id: ambassadorId,
        direction: "credit",
        amount: ambassadorCommission,
        currency_code: currencyCode,
        status: "pending",
      });
    }
    if (taxAmount > 0) {
      lines.push({
        ledger_id: ledger.id,
        party_type: "tax_authority",
        party_id: null,
        direction: "credit",
        amount: taxAmount,
        currency_code: currencyCode,
        status: "pending",
      });
    }

    await Promise.all(lines.map((l) => this.createSettlementLines(l)));

    return ledger;
  }

  /**
   * Reverse settlement lines after a refund or RMA approval.
   */
  async reverseSettlement(
    ledgerId: string,
    reversedAmount: number,
    triggerType: string,
    triggerId: string,
  ): Promise<any> {
    const lines = (await this.listSettlementLines({
      ledger_id: ledgerId,
      status: "pending",
    })) as any[];
    const reversal = await this.createSettlementReversals({
      ledger_id: ledgerId,
      trigger_type: triggerType,
      trigger_id: triggerId,
      reversed_amount: reversedAmount,
      reversal_lines: lines.map((l) => ({ line_id: l.id, amount: l.amount })),
      created_at: new Date(),
    } as any);

    // Mark lines as reversed
    await Promise.all(
      lines.map((l) =>
        this.updateSettlementLines({ id: l.id, status: "reversed" } as any),
      ),
    );
    await this.updateSettlementLedgers({
      id: ledgerId,
      status: "reversed",
      refund_total: reversedAmount,
    } as any);

    return reversal;
  }

  /**
   * Freeze settlement when a dispute is opened.
   */
  async freezeForDispute(ledgerId: string, reason: string): Promise<void> {
    await this.updateSettlementLedgers({
      id: ledgerId,
      status: "frozen",
      freeze_reason: reason,
      frozen_at: new Date(),
    } as any);
  }

  /**
   * Get all unsettled ledgers ready to post to ERPNext.
   */
  async getReadyForErpPost(): Promise<any[]> {
    return (await this.listSettlementLedgers({
      status: "settled",
      erp_posted_at: null,
    })) as any[];
  }
}

export default SettlementModuleService;
