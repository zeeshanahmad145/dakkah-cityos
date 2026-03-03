/**
 * ERPNext Posting Contract
 *
 * Defines exactly what data Medusa sends to ERPNext for each accounting event.
 * This is the authoritative specification for the ERPNext integration adapter.
 *
 * Truth hierarchy: PSP → Ledger → ERPNext → Settlement
 * The ReconciliationConfig enforces this ordering at drift-check time.
 *
 * ERPNext document types used:
 *   - Journal Entry          → double-entry ledger postings
 *   - Sales Invoice          → vendor revenue recognition
 *   - Purchase Invoice       → platform costs / commissions
 *   - Payment Entry          → PSP receipts + payout batches
 *   - Credit Note            → refunds + reversals
 *   - GL Entry               → raw ledger audit (via Journal Entry)
 */

import { createLogger } from "../../lib/logger";

const logger = createLogger("erpnext:posting");

const ERP_BASE_URL = () => process.env.ERPNEXT_URL ?? "";
const ERP_API_KEY = () => process.env.ERPNEXT_API_KEY ?? "";
const ERP_SECRET = () => process.env.ERPNEXT_API_SECRET ?? "";

function erpHeaders() {
  return {
    "Content-Type": "application/json",
    Authorization: `token ${ERP_API_KEY()}:${ERP_SECRET()}`,
  };
}

async function erpPost(endpoint: string, body: unknown): Promise<unknown> {
  const url = `${ERP_BASE_URL()}/api/resource${endpoint}`;
  const res = await fetch(url, {
    method: "POST",
    headers: erpHeaders(),
    body: JSON.stringify({ data: body }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`ERPNext POST ${endpoint} failed: ${res.status} ${text}`);
  }
  return res.json();
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. Settlement Line → ERPNext Journal Entry
//    Called by settlement events or the export-settlement-to-erpnext.ts job
// ─────────────────────────────────────────────────────────────────────────────
export async function postSettlementToERP(params: {
  referenceId: string;
  referenceType: string;
  grossAmount: number;
  vendorNet: number;
  commission: number;
  tax: number;
  levy: number;
  currencyCode: string;
  postingDate: string;
  vendorAccount: string;
  description?: string;
}) {
  if (!ERP_BASE_URL())
    return logger.info("ERPNext not configured — settlement skip");

  const jvEntries: any[] = [
    // Gross amount from PSP into platform clearing account
    {
      account: "Clearing Account - PSP",
      credit: params.grossAmount,
      debit: 0,
      currency: params.currencyCode,
    },
    // Vendor net payout
    {
      account: `${params.vendorAccount} - Payable`,
      credit: 0,
      debit: params.vendorNet,
      currency: params.currencyCode,
    },
    // Platform commission
    {
      account: "Commission Income",
      credit: 0,
      debit: params.commission,
      currency: params.currencyCode,
    },
    // Tax (VAT 15%)
    ...(params.tax > 0
      ? [
          {
            account: "VAT Payable - ZATCA",
            credit: 0,
            debit: params.tax,
            currency: params.currencyCode,
          },
        ]
      : []),
    // Government levy
    ...(params.levy > 0
      ? [
          {
            account: "Government Levy Payable",
            credit: 0,
            debit: params.levy,
            currency: params.currencyCode,
          },
        ]
      : []),
  ];

  await erpPost("/Journal Entry", {
    voucher_type: "Journal Entry",
    posting_date: params.postingDate,
    company: process.env.ERPNEXT_COMPANY ?? "Dakkah",
    title: `Settlement: ${params.referenceId}`,
    user_remark: params.description ?? `${params.referenceType} settlement`,
    accounts: jvEntries,
    custom_reference_type: params.referenceType,
    custom_reference_id: params.referenceId,
  });

  logger.info(
    `ERPNext: Journal Entry posted for settlement ${params.referenceId}`,
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. Refund → ERPNext Credit Note
// ─────────────────────────────────────────────────────────────────────────────
export async function postRefundToERP(params: {
  orderId: string;
  vendorId: string;
  refundAmount: number;
  taxAmount: number;
  currencyCode: string;
  postingDate: string;
  reason?: string;
}) {
  if (!ERP_BASE_URL())
    return logger.info("ERPNext not configured — refund skip");

  await erpPost("/Journal Entry", {
    voucher_type: "Journal Entry",
    posting_date: params.postingDate,
    company: process.env.ERPNEXT_COMPANY ?? "Dakkah",
    title: `Refund: ${params.orderId}`,
    user_remark: params.reason ?? "Customer refund",
    accounts: [
      {
        account: "Customer Refunds",
        debit: params.refundAmount,
        credit: 0,
        currency: params.currencyCode,
      },
      {
        account: "Clearing Account - PSP",
        debit: 0,
        credit: params.refundAmount,
        currency: params.currencyCode,
      },
      ...(params.taxAmount > 0
        ? [
            {
              account: "VAT Payable - ZATCA",
              debit: params.taxAmount,
              credit: 0,
              currency: params.currencyCode,
            },
          ]
        : []),
    ],
    custom_reference_type: "order",
    custom_reference_id: params.orderId,
  });

  logger.info(
    `ERPNext: Credit Note posted for refund on order ${params.orderId}`,
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. Payout Batch → ERPNext Payment Entry
// ─────────────────────────────────────────────────────────────────────────────
export async function postPayoutBatchToERP(params: {
  batchId: string;
  vendorId: string;
  vendorAccount: string;
  totalAmount: number;
  currencyCode: string;
  payoutDate: string;
  paymentMethod?: string;
}) {
  if (!ERP_BASE_URL())
    return logger.info("ERPNext not configured — payout skip");

  await erpPost("/Payment Entry", {
    payment_type: "Pay",
    posting_date: params.payoutDate,
    company: process.env.ERPNEXT_COMPANY ?? "Dakkah",
    party_type: "Supplier",
    party: params.vendorAccount,
    paid_amount: params.totalAmount,
    received_amount: params.totalAmount,
    source_exchange_rate: 1,
    target_exchange_rate: 1,
    paid_from: "Payouts Bank Account",
    paid_to: `${params.vendorAccount} - Bank`,
    reference_no: params.batchId,
    reference_date: params.payoutDate,
    mode_of_payment: params.paymentMethod ?? "Bank Transfer",
    custom_vendor_id: params.vendorId,
    custom_batch_id: params.batchId,
  });

  logger.info(
    `ERPNext: Payment Entry posted for payout batch ${params.batchId}`,
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. Tax Export (ZATCA) → ERPNext Sales Invoice
// ─────────────────────────────────────────────────────────────────────────────
export async function postTaxInvoiceToERP(params: {
  orderId: string;
  customerId: string;
  items: Array<{
    description: string;
    qty: number;
    rate: number;
    amount: number;
    taxRate: number;
  }>;
  taxTotal: number;
  grandTotal: number;
  currencyCode: string;
  invoiceDate: string;
}) {
  if (!ERP_BASE_URL())
    return logger.info("ERPNext not configured — tax invoice skip");

  await erpPost("/Sales Invoice", {
    posting_date: params.invoiceDate,
    company: process.env.ERPNEXT_COMPANY ?? "Dakkah",
    customer: params.customerId,
    currency: params.currencyCode,
    items: params.items.map((item) => ({
      description: item.description,
      qty: item.qty,
      rate: item.rate,
      amount: item.amount,
      item_tax_rate: JSON.stringify({ "VAT 15%": item.taxRate }),
    })),
    taxes: [
      {
        charge_type: "Actual",
        account_head: "VAT Payable - ZATCA",
        tax_amount: params.taxTotal,
      },
    ],
    grand_total: params.grandTotal,
    custom_order_id: params.orderId,
  });

  logger.info(`ERPNext: Sales Invoice posted for order ${params.orderId}`);
}
