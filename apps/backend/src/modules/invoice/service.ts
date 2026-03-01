import { MedusaService } from "@medusajs/framework/utils";
import { Invoice } from "./models/invoice";
import { InvoiceItem } from "./models/invoice-item";

type InvoiceRecord = {
  id: string;
  invoice_number: string;
  company_id: string;
  customer_id: string | null;
  status: string;
  issue_date: Date;
  due_date: Date;
  paid_at: Date | null;
  subtotal: number | string;
  tax_total: number | string;
  discount_total: number | string;
  total: number | string;
  amount_paid: number | string;
  amount_due: number | string;
  currency_code: string;
  period_start: Date | null;
  period_end: Date | null;
  payment_terms: string | null;
  payment_terms_days: number;
  notes: string | null;
  internal_notes: string | null;
  pdf_url: string | null;
  metadata: Record<string, unknown> | null;
};

type InvoiceItemRecord = {
  id: string;
  invoice_id: string;
  title: string;
  description: string | null;
  quantity: number | string;
  unit_price: number | string;
  subtotal: number | string;
  tax_total: number | string;
  total: number | string;
};

interface InvoiceServiceBase {
  listInvoices(
    filters?: Record<string, unknown>,
    opts?: Record<string, unknown>,
  ): Promise<InvoiceRecord[]>;
  retrieveInvoice(id: string): Promise<InvoiceRecord>;
  createInvoices(data: Record<string, unknown>): Promise<InvoiceRecord>;
  updateInvoices(data: Record<string, unknown>): Promise<InvoiceRecord>;
  listInvoiceItems(
    filters?: Record<string, unknown>,
  ): Promise<InvoiceItemRecord[]>;
  createInvoiceItems(
    data: Record<string, unknown> | Record<string, unknown>[],
  ): Promise<InvoiceItemRecord | InvoiceItemRecord[]>;
}

const Base = MedusaService({ Invoice, InvoiceItem });

class InvoiceModuleService extends Base implements InvoiceServiceBase {
  async generateInvoiceNumber(companyId: string): Promise<string> {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const prefix = companyId.slice(0, 4).toUpperCase();

    const invoices = await this.listInvoices({
      company_id: companyId,
    }) as any;
    const count = invoices.filter((inv) =>
      inv.invoice_number.startsWith(`INV-${prefix}-${year}${month}`),
    ).length;

    const sequence = String(count + 1).padStart(4, "0");
    return `INV-${prefix}-${year}${month}-${sequence}`;
  }

  async createInvoiceWithItems(data: {
    company_id: string;
    customer_id?: string;
    issue_date: Date;
    due_date: Date;
    period_start?: Date;
    period_end?: Date;
    payment_terms?: string;
    payment_terms_days?: number;
    currency_code?: string;
    notes?: string;
    items: Array<{
      title: string;
      description?: string;
      order_id?: string;
      order_display_id?: string;
      quantity: number;
      unit_price: number;
    }>;
    metadata?: Record<string, unknown>;
  }): Promise<{
    invoice: InvoiceRecord;
    items: InvoiceItemRecord | InvoiceItemRecord[];
  }> {
    const invoiceNumber = await this.generateInvoiceNumber(data.company_id);

    const itemsWithTotals = data.items.map((item) => ({
      ...item,
      subtotal: item.quantity * item.unit_price,
      tax_total: 0,
      total: item.quantity * item.unit_price,
    }));

    const subtotal = itemsWithTotals.reduce(
      (sum, item) => sum + item.subtotal,
      0,
    );
    const tax_total = 0;
    const total = subtotal + tax_total;

    const invoice = await this.createInvoices({
      invoice_number: invoiceNumber,
      company_id: data.company_id,
      customer_id: data.customer_id ?? null,
      status: "draft",
      issue_date: data.issue_date,
      due_date: data.due_date,
      period_start: data.period_start ?? null,
      period_end: data.period_end ?? null,
      payment_terms: data.payment_terms ?? null,
      payment_terms_days: data.payment_terms_days ?? 30,
      subtotal,
      tax_total,
      total,
      amount_due: total,
      currency_code: data.currency_code ?? "usd",
      notes: data.notes ?? null,
      metadata: data.metadata ?? null,
    } as any);

    const createdItems = await this.createInvoiceItems(
      itemsWithTotals.map((item) => ({ ...item, invoice_id: invoice.id })),
    );

    return { invoice, items: createdItems };
  }

  async markAsSent(invoiceId: string): Promise<InvoiceRecord> {
    return this.updateInvoices({ id: invoiceId, status: "sent" } as any);
  }

  async markAsPaid(invoiceId: string, amount?: number): Promise<InvoiceRecord> {
    const invoiceList = await this.listInvoices({ id: invoiceId }) as any;
    const invoice = invoiceList[0];
    if (!invoice) throw new Error(`Invoice ${invoiceId} not found`);

    const amountPaid = amount ?? Number(invoice.total);
    const newAmountPaid = Number(invoice.amount_paid) + amountPaid;
    const amountDue = Number(invoice.total) - newAmountPaid;

    return this.updateInvoices({
      id: invoiceId,
      status: amountDue <= 0 ? "paid" : invoice.status,
      amount_paid: newAmountPaid,
      amount_due: Math.max(0, amountDue),
      paid_at: amountDue <= 0 ? new Date() : null,
    } as any);
  }

  async markOverdueInvoices(): Promise<InvoiceRecord[]> {
    const now = new Date();
    const overdueInvoices = await this.listInvoices({
      status: "sent",
      due_date: { $lt: now.toISOString() as any },
    });
    const updated: InvoiceRecord[] = [];
    for (const invoice of overdueInvoices) {
      const result = await this.updateInvoices({
        id: invoice.id,
        status: "overdue",
      } as any);
      updated.push(result);
    }
    return updated;
  }

  async voidInvoice(
    invoiceId: string,
    reason?: string,
  ): Promise<InvoiceRecord> {
    return this.updateInvoices({
      id: invoiceId,
      status: "void",
      internal_notes: reason ?? null,
    } as any);
  }

  async generateInvoiceNumberByTenant(tenantId: string): Promise<string> {
    const now = new Date();
    const year = now.getFullYear();
    const invoices = await this.listInvoices({ company_id: tenantId }) as any;
    const matching = invoices.filter((inv) =>
      inv.invoice_number.startsWith(`INV-${year}-`),
    );
    const sequence = String(matching.length + 1).padStart(5, "0");
    return `INV-${year}-${sequence}`;
  }

  async calculateInvoiceTotals(invoiceId: string): Promise<{
    subtotal: number;
    taxTotal: number;
    total: number;
    itemCount: number;
  }> {
    const invoice = await this.retrieveInvoice(invoiceId) as any;
    if (!invoice) throw new Error("Invoice not found");
    const items = await this.listInvoiceItems({ invoice_id: invoiceId }) as any;

    let subtotal = 0;
    let taxTotal = 0;

    for (const item of items) {
      subtotal += Number(item.quantity) * Number(item.unit_price);
      taxTotal += Number(item.tax_total);
    }

    const total = subtotal + taxTotal;

    await this.updateInvoices({
      id: invoiceId,
      subtotal,
      tax_total: taxTotal,
      total,
      amount_due: total - Number(invoice.amount_paid),
    } as any);

    return { subtotal, taxTotal, total, itemCount: items.length };
  }

  async markOverdue(
    tenantId: string,
  ): Promise<{ updated: number; invoiceIds: string[] }> {
    const now = new Date();
    const invoices = await this.listInvoices({
      company_id: tenantId,
      status: "sent",
      due_date: { $lt: now.toISOString() as any },
    });
    const updatedIds: string[] = [];
    for (const invoice of invoices) {
      await this.updateInvoices({ id: invoice.id, status: "overdue" } as any);
      updatedIds.push(invoice.id);
    }
    return { updated: updatedIds.length, invoiceIds: updatedIds };
  }

  async getPaymentSummary(invoiceId: string): Promise<{
    invoiceId: string;
    status: string;
    total: number;
    amountPaid: number;
    balanceRemaining: number;
    isFullyPaid: boolean;
    paidAt: Date | null;
    dueDate: Date | null;
    isOverdue: boolean;
  }> {
    const invoice = await this.retrieveInvoice(invoiceId) as any;
    if (!invoice) throw new Error("Invoice not found");
    const total = Number(invoice.total);
    const amountPaid = Number(invoice.amount_paid);
    const balanceRemaining = Math.max(0, total - amountPaid);
    const now = new Date();
    const dueDate = invoice.due_date ? new Date(invoice.due_date) : null;
    const isOverdue = dueDate ? dueDate < now && balanceRemaining > 0 : false;

    return {
      invoiceId,
      status: invoice.status,
      total,
      amountPaid,
      balanceRemaining,
      isFullyPaid: balanceRemaining <= 0,
      paidAt: invoice.paid_at,
      dueDate,
      isOverdue,
    };
  }
}

export default InvoiceModuleService;
