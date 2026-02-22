import { z } from "zod";
import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { handleApiError } from "../../../../lib/api-error-handler";

const updateInvoiceSchema = z
  .object({
    due_date: z.string().optional(),
    payment_terms: z.string().optional(),
    payment_terms_days: z.number().optional(),
    notes: z.string().optional(),
    internal_notes: z.string().optional(),
  })
  .passthrough();

// GET /admin/invoices/:id - Get invoice detail
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);
  const { id } = req.params;

  const { data: invoices } = await query.graph({
    entity: "invoice",
    fields: [
      "id",
      "invoice_number",
      "company_id",
      "customer_id",
      "status",
      "issue_date",
      "due_date",
      "paid_at",
      "subtotal",
      "tax_total",
      "discount_total",
      "total",
      "amount_paid",
      "amount_due",
      "currency_code",
      "period_start",
      "period_end",
      "payment_terms",
      "payment_terms_days",
      "notes",
      "internal_notes",
      "pdf_url",
      "items.*",
      "metadata",
      "created_at",
      "updated_at",
    ],
    filters: { id },
  });

  if (!invoices.length) {
    return res.status(404).json({ message: "Invoice not found" });
  }

  const invoice = invoices[0];

  // Fetch company and customer info
  let company = null;
  let customer = null;

  if (invoice.company_id) {
    const { data: companies } = await query.graph({
      entity: "company",
      fields: [
        "id",
        "name",
        "email",
        "phone",
        "address",
        "city",
        "state",
        "postal_code",
        "country",
      ],
      filters: { id: invoice.company_id },
    });
    company = companies[0] || null;
  }

  if (invoice.customer_id) {
    const { data: customers } = await query.graph({
      entity: "customer",
      fields: ["id", "email", "first_name", "last_name", "phone"],
      filters: { id: invoice.customer_id },
    });
    customer = customers[0] || null;
  }

  res.json({ invoice: { ...invoice, company, customer } });
}

// PUT /admin/invoices/:id - Update invoice
export async function PUT(req: MedusaRequest, res: MedusaResponse) {
  const invoiceModule = req.scope.resolve("invoice") as any;
  const { id } = req.params;

  const { due_date, payment_terms, payment_terms_days, notes, internal_notes } =
    req.body as {
      due_date?: string;
      payment_terms?: string;
      payment_terms_days?: number;
      notes?: string;
      internal_notes?: string;
    };

  const updateData: Record<string, unknown> = { id };
  if (due_date) updateData.due_date = new Date(due_date);
  if (payment_terms !== undefined) updateData.payment_terms = payment_terms;
  if (payment_terms_days !== undefined)
    updateData.payment_terms_days = payment_terms_days;
  if (notes !== undefined) updateData.notes = notes;
  if (internal_notes !== undefined) updateData.internal_notes = internal_notes;

  const invoice = await invoiceModule.updateInvoices(updateData);

  res.json({ invoice });
}

// DELETE /admin/invoices/:id - Delete draft invoice
export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  const invoiceModule = req.scope.resolve("invoice") as any;
  const { id } = req.params;

  // Check if invoice is draft
  const [invoice] = await invoiceModule.listInvoices({ id });

  if (!invoice) {
    return res.status(404).json({ message: "Invoice not found" });
  }

  if (invoice.status !== "draft") {
    return res
      .status(400)
      .json({ message: "Only draft invoices can be deleted" });
  }

  await invoiceModule.deleteInvoices(id);

  res.json({ success: true });
}
