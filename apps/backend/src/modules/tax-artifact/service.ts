import { MedusaService } from "@medusajs/framework/utils";
import { TaxInvoice, TaxCreditNote } from "./models/tax-invoice";

let invoiceCounter = 1000;

class TaxArtifactModuleService extends MedusaService({
  TaxInvoice,
  TaxCreditNote,
}) {
  /**
   * Generate a VAT-compliant tax invoice from an order.
   */
  async generateInvoice(order: {
    id: string;
    total: number;
    tax_total: number;
    subtotal: number;
    currency_code: string;
    items: any[];
    billing_address?: any;
    customer?: any;
    company?: { vat_number?: string; name?: string };
    vendor?: { vat_number?: string; name?: string };
  }): Promise<any> {
    const existing = (await this.listTaxInvoices({
      order_id: order.id,
    })) as any[];
    if (existing.length > 0) return existing[0];

    const invoiceNumber = `INV-${Date.now()}-${++invoiceCounter}`;

    const lines = (order.items ?? []).map((item: any) => ({
      description: item.title ?? item.name ?? "Item",
      qty: item.quantity ?? 1,
      unit_price: item.unit_price ?? 0,
      tax_rate: item.tax_rate ?? 0.15,
      tax_amount:
        (item.unit_price ?? 0) * (item.quantity ?? 1) * (item.tax_rate ?? 0.15),
      total: (item.unit_price ?? 0) * (item.quantity ?? 1),
    }));

    return this.createTaxInvoices({
      order_id: order.id,
      invoice_number: invoiceNumber,
      issue_date: new Date(),
      buyer_name: order.company?.name ?? order.customer?.first_name ?? null,
      buyer_vat_number: order.company?.vat_number ?? null,
      buyer_address: order.billing_address ?? null,
      seller_name: order.vendor?.name ?? "Dakkah Platform",
      seller_vat_number:
        order.vendor?.vat_number ?? process.env.PLATFORM_VAT_NUMBER ?? null,
      lines,
      total_excl_tax: order.subtotal ?? order.total - order.tax_total,
      total_tax: order.tax_total ?? 0,
      total_incl_tax: order.total,
      currency_code: order.currency_code ?? "SAR",
      status: "issued",
    } as any);
  }

  /**
   * Generate a credit note for a refunded order.
   */
  async generateCreditNote(
    orderId: string,
    reason: string,
    refundAmount: number,
  ): Promise<any> {
    const invoices = (await this.listTaxInvoices({
      order_id: orderId,
    })) as any[];
    if (invoices.length === 0)
      throw new Error(`No tax invoice found for order ${orderId}`);

    const invoice = invoices[0];
    const existing = (await this.listTaxCreditNotes({
      order_id: orderId,
    })) as any[];
    if (existing.length > 0) return existing[0];

    const taxAmount = refundAmount * 0.15;
    return this.createTaxCreditNotes({
      original_invoice_id: invoice.id,
      order_id: orderId,
      credit_note_number: `CN-${Date.now()}`,
      issue_date: new Date(),
      reason,
      lines: [
        {
          description: "Refund",
          total: refundAmount - taxAmount,
          tax_amount: taxAmount,
        },
      ],
      total_excl_tax: refundAmount - taxAmount,
      total_tax: taxAmount,
      total_incl_tax: refundAmount,
      currency_code: invoice.currency_code ?? "SAR",
      status: "issued",
    } as any);
  }

  async getUnpostedInvoices(): Promise<any[]> {
    return (await this.listTaxInvoices({
      status: "issued",
      erp_posted_at: null,
    })) as any[];
  }

  async getUnpostedCreditNotes(): Promise<any[]> {
    return (await this.listTaxCreditNotes({
      status: "issued",
      erp_posted_at: null,
    })) as any[];
  }
}

export default TaxArtifactModuleService;
