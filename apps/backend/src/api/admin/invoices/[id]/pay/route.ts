import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { handleApiError } from "../../../../../lib/api-error-handler";

const payInvoiceSchema = z.object({
  amount: z.number().optional(),
}).passthrough()

// POST /admin/invoices/:id/pay - Record payment on invoice
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const invoiceModule = req.scope.resolve("invoice") as any;
    const { id } = req.params;
    const { amount } = req.body as { amount?: number };

    const invoice = await invoiceModule.markAsPaid(id, amount);

    res.json({ invoice });
  } catch (error: any) {
    handleApiError(res, error, "POST admin invoices id pay");
  }
}
