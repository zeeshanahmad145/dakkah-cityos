import { model } from "@medusajs/framework/utils";

/**
 * TaxInvoice — a VAT-compliant invoice artifact per completed order.
 * Postable to ERPNext as a Sales Invoice.
 */
const TaxInvoice = model.define("tax_invoice", {
  id: model.id().primaryKey(),
  order_id: model.text(),
  invoice_number: model.text(),
  issue_date: model.dateTime(),
  // Buyer info
  buyer_name: model.text().nullable(),
  buyer_vat_number: model.text().nullable(),
  buyer_address: model.json().nullable(),
  // Seller info (platform or vendor)
  seller_name: model.text().nullable(),
  seller_vat_number: model.text().nullable(),
  // Lines: [{ description, qty, unit_price, tax_rate, tax_amount, total }]
  lines: model.json(),
  total_excl_tax: model.number(),
  total_tax: model.number(),
  total_incl_tax: model.number(),
  currency_code: model.text().default("SAR"),
  // status: draft|issued|posted_to_erp|cancelled
  status: model.text().default("draft"),
  erp_reference: model.text().nullable(),
  erp_posted_at: model.dateTime().nullable(),
  is_exempt: model.boolean().default(false),
  exempt_reason: model.text().nullable(),
});

/**
 * TaxCreditNote — issued when an order is refunded.
 * References original TaxInvoice.
 */
const TaxCreditNote = model.define("tax_credit_note", {
  id: model.id().primaryKey(),
  original_invoice_id: model.text(),
  order_id: model.text(),
  credit_note_number: model.text(),
  issue_date: model.dateTime(),
  reason: model.text(),
  lines: model.json(),
  total_excl_tax: model.number(),
  total_tax: model.number(),
  total_incl_tax: model.number(),
  currency_code: model.text().default("SAR"),
  status: model.text().default("draft"),
  erp_reference: model.text().nullable(),
  erp_posted_at: model.dateTime().nullable(),
});

export { TaxInvoice, TaxCreditNote };
