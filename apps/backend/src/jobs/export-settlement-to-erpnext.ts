import type { MedusaContainer } from "@medusajs/framework";
import { SETTLEMENT_MODULE } from "../modules/settlement";
import type SettlementModuleService from "../modules/settlement/service";
import { createLogger } from "../lib/logger";

const logger = createLogger("job:export-settlement-to-erpnext");

const ERP_API_URL = process.env.ERPNEXT_API_URL ?? "";
const ERP_API_KEY = process.env.ERPNEXT_API_KEY ?? "";

export default async function exportSettlementToErpnext(
  container: MedusaContainer,
) {
  if (!ERP_API_URL) {
    logger.warn("ERPNEXT_API_URL not set — skipping ERP settlement export");
    return;
  }

  const settlementService: SettlementModuleService =
    container.resolve(SETTLEMENT_MODULE);

  try {
    const ready = await settlementService.getReadyForErpPost();
    if (ready.length === 0) {
      logger.info("No settlements pending ERP post");
      return;
    }

    for (const ledger of ready) {
      const payload = {
        doctype: "Journal Entry",
        company: process.env.ERPNEXT_COMPANY ?? "Dakkah",
        posting_date: new Date().toISOString().split("T")[0],
        custom_order_id: ledger.order_id,
        custom_settlement_id: ledger.id,
        accounts: [
          // Revenue: gross amount
          {
            account: "Sales - Gross",
            debit_in_account_currency: ledger.gross_amount,
            credit_in_account_currency: 0,
          },
          // Platform fee retained
          {
            account: "Platform Fee Income",
            debit_in_account_currency: 0,
            credit_in_account_currency: ledger.platform_fee,
          },
          // Vendor payable
          {
            account: "Vendor Payables",
            debit_in_account_currency: 0,
            credit_in_account_currency: ledger.vendor_net,
          },
          // Tax payable
          ...(ledger.tax_collected > 0
            ? [
                {
                  account: "Tax Payable",
                  debit_in_account_currency: 0,
                  credit_in_account_currency: ledger.tax_collected,
                },
              ]
            : []),
        ],
      };

      const res = await fetch(`${ERP_API_URL}/api/resource/Journal Entry`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `token ${ERP_API_KEY}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        logger.error(`ERP post failed for ledger ${ledger.id}: ${res.status}`);
        continue;
      }

      await settlementService.updateSettlementLedgers({
        id: ledger.id,
        erp_posted_at: new Date(),
        status: "posted",
      } as any);
      logger.info(`Ledger ${ledger.id} posted to ERPNext`);
    }
  } catch (err) {
    logger.error(`ERP settlement export error: ${String(err)}`);
  }
}

export const config = {
  name: "export-settlement-to-erpnext",
  schedule: "0 2 * * *", // Daily at 2am
};
