import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { handleApiError } from "../../../../../lib/api-error-handler";

// POST /admin/invoices/:id/send - Mark invoice as sent
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const invoiceModule = req.scope.resolve("invoice") as unknown as any;
    const { id } = req.params;

    const invoice = await invoiceModule.markAsSent(id);

    res.json({ invoice });
  } catch (error: unknown) {
    handleApiError(res, error, "POST admin invoices id send");
  }
}
