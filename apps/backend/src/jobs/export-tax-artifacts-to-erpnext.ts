import type { MedusaContainer } from "@medusajs/framework";
import { TAX_ARTIFACT_MODULE } from "../modules/tax-artifact";
import type TaxArtifactModuleService from "../modules/tax-artifact/service";
import { createLogger } from "../lib/logger";

const logger = createLogger("job:export-tax-artifacts-to-erpnext");

const ERPNEXT_URL = process.env.ERPNEXT_API_URL ?? "";
const ERPNEXT_KEY = process.env.ERPNEXT_API_KEY ?? "";
const ERPNEXT_COMPANY = process.env.ERPNEXT_COMPANY ?? "Dakkah";

export default async function exportTaxArtifactsToErpnext(
  container: MedusaContainer,
) {
  const taxService: TaxArtifactModuleService =
    container.resolve(TAX_ARTIFACT_MODULE);

  if (!ERPNEXT_URL || !ERPNEXT_KEY) {
    logger.warn(
      "ERPNEXT_API_URL or ERPNEXT_API_KEY not set — skipping tax artifact export",
    );
    return;
  }

  try {
    const invoices = await taxService.getUnpostedInvoices();
    const creditNotes = await taxService.getUnpostedCreditNotes();

    let invoicesPosted = 0,
      creditNotesPosted = 0;

    for (const inv of invoices) {
      const payload = {
        doctype: "Sales Invoice",
        company: ERPNEXT_COMPANY,
        customer: inv.buyer_name ?? "Walk-in Customer",
        tax_id: inv.buyer_vat_number ?? "",
        posting_date: new Date(inv.issue_date).toISOString().slice(0, 10),
        currency: inv.currency_code,
        items: (inv.lines ?? []).map((l: any) => ({
          item_name: l.description,
          qty: l.qty ?? 1,
          rate: l.unit_price ?? l.total,
          tax_rate: (l.tax_rate ?? 0.15) * 100,
        })),
        custom_medusa_invoice_id: inv.id,
        custom_medusa_order_id: inv.order_id,
      };

      const res = await fetch(`${ERPNEXT_URL}/api/resource/Sales Invoice`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `token ${ERPNEXT_KEY}`,
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const body = (await res.json()) as any;
        await taxService.updateTaxInvoices({
          id: inv.id,
          status: "posted_to_erp",
          erp_reference: body?.data?.name,
          erp_posted_at: new Date(),
        } as any);
        invoicesPosted++;
      } else {
        logger.warn(`Failed to post invoice ${inv.id}: ${res.status}`);
      }
    }

    for (const cn of creditNotes) {
      const res = await fetch(`${ERPNEXT_URL}/api/resource/Sales Invoice`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `token ${ERPNEXT_KEY}`,
        },
        body: JSON.stringify({
          doctype: "Sales Invoice",
          is_return: 1,
          return_against: cn.erp_reference,
          company: ERPNEXT_COMPANY,
          posting_date: new Date(cn.issue_date).toISOString().slice(0, 10),
          currency: cn.currency_code,
          items: (cn.lines ?? []).map((l: any) => ({
            item_name: l.description,
            qty: -1,
            rate: l.total,
          })),
          custom_medusa_credit_note_id: cn.id,
        }),
      });
      if (res.ok) {
        const body = (await res.json()) as any;
        await taxService.updateTaxCreditNotes({
          id: cn.id,
          status: "posted_to_erp",
          erp_reference: body?.data?.name,
          erp_posted_at: new Date(),
        } as any);
        creditNotesPosted++;
      }
    }

    logger.info(
      `Tax artifact export: ${invoicesPosted} invoices, ${creditNotesPosted} credit notes posted to ERPNext`,
    );
  } catch (err) {
    logger.error(`Tax artifact ERP export error: ${String(err)}`);
  }
}

export const config = {
  name: "export-tax-artifacts-to-erpnext",
  schedule: "0 6 * * *", // Daily at 6am
};
