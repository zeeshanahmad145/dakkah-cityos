import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "zod"
import { handleApiError } from "../../../../../lib/api-error-handler"

const voidInvoiceSchema = z.object({
  reason: z.string().optional(),
}).passthrough()

// POST /admin/invoices/:id/void - Void an invoice
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const parsed = voidInvoiceSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ message: "Validation failed", errors: parsed.error.issues })
    }

    const invoiceModule = req.scope.resolve("invoice")
    const { id } = req.params
    const { reason } = parsed.data
  
    const invoice = await invoiceModule.voidInvoice(id, reason)
  
    res.json({ invoice })

  } catch (error: any) {
    handleApiError(res, error, "POST admin invoices id void")}
}

