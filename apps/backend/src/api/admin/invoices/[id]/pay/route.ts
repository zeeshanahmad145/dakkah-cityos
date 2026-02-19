import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "zod"
import { handleApiError } from "../../../../../lib/api-error-handler"

const payInvoiceSchema = z.object({
  amount: z.number().optional(),
}).passthrough()

// POST /admin/invoices/:id/pay - Record payment on invoice
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const parsed = payInvoiceSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ message: "Validation failed", errors: parsed.error.issues })
    }

    const invoiceModule = req.scope.resolve("invoice")
    const { id } = req.params
    const { amount } = parsed.data
  
    const invoice = await invoiceModule.markAsPaid(id, amount)
  
    res.json({ invoice })

  } catch (error: any) {
    handleApiError(res, error, "POST admin invoices id pay")}
}

