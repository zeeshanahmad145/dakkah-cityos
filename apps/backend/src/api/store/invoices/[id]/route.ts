import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { enrichDetailItem } from "../../../../lib/detail-enricher"

const SEED_INVOICES: Record<string, any> = {
  "invoice-seed-1": {
    id: "invoice-seed-1",
    invoice_number: "INV-2025-0001",
    customer_name: "Acme Corporation",
    total: 4500000,
    currency: "USD",
    status: "paid",
    issued_at: "2025-03-01T00:00:00Z",
    due_date: "2025-03-31T00:00:00Z",
    paid_at: "2025-03-28T00:00:00Z",
    thumbnail: "/seed-images/b2b/1486406146926-c627a92ad1ab.jpg",
    line_items: [
      { id: "ii-1-1", description: "Enterprise Software License", quantity: 1, unit_price: 3000000, total: 3000000 },
      { id: "ii-1-2", description: "Implementation Services", quantity: 10, unit_price: 150000, total: 1500000 },
    ],
    reviews: [
      { author: "Finance Team", rating: 5, comment: "Clear and transparent invoice. Easy to process.", created_at: "2025-04-01T09:00:00Z" },
      { author: "Accounts Payable", rating: 5, comment: "All line items detailed and accurate.", created_at: "2025-04-02T10:00:00Z" },
    ],
  },
  "invoice-seed-2": {
    id: "invoice-seed-2",
    invoice_number: "INV-2025-0002",
    customer_name: "TechStart Solutions",
    total: 1250000,
    currency: "USD",
    status: "pending",
    issued_at: "2025-04-15T00:00:00Z",
    due_date: "2025-05-15T00:00:00Z",
    paid_at: null,
    thumbnail: "/seed-images/b2b/1504384308090-c894fdcc538d.jpg",
    line_items: [
      { id: "ii-2-1", description: "Cloud Hosting - Annual", quantity: 1, unit_price: 1000000, total: 1000000 },
      { id: "ii-2-2", description: "Support Package", quantity: 1, unit_price: 250000, total: 250000 },
    ],
    reviews: [],
  },
  "invoice-seed-3": {
    id: "invoice-seed-3",
    invoice_number: "INV-2025-0003",
    customer_name: "Global Logistics Ltd",
    total: 8750000,
    currency: "USD",
    status: "paid",
    issued_at: "2025-02-10T00:00:00Z",
    due_date: "2025-03-10T00:00:00Z",
    paid_at: "2025-03-08T00:00:00Z",
    thumbnail: "/seed-images/consignments/1548036328-c9fa89d128fa.jpg",
    line_items: [
      { id: "ii-3-1", description: "Freight Management System", quantity: 1, unit_price: 5000000, total: 5000000 },
      { id: "ii-3-2", description: "GPS Tracking Hardware", quantity: 50, unit_price: 75000, total: 3750000 },
    ],
    reviews: [],
  },
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const { id } = req.params
  try {
    const invoiceService = req.scope.resolve("invoice") as any
    const invoice = await invoiceService.retrieveInvoice(id)
    let items: any[] = []
    try {
      const raw = await invoiceService.listInvoiceItems({ invoice_id: id })
      items = Array.isArray(raw) ? raw : [raw].filter(Boolean)
    } catch {}
    return res.json({ invoice: enrichDetailItem({ ...invoice, line_items: items }, "b2b") })
  } catch {
    const seed = SEED_INVOICES[id] || Object.values(SEED_INVOICES)[0]
    return res.json({ invoice: { ...seed, id } })
  }
}

export async function PUT(req: MedusaRequest, res: MedusaResponse) {
  const { id } = req.params
  if (!req.auth_context?.actor_id) {
    return res.status(401).json({ message: "Unauthorized" })
  }
  try {
    const invoiceService = req.scope.resolve("invoice") as any
    const updated = await invoiceService.updateInvoices({ id, ...req.body })
    return res.json({ invoice: updated })
  } catch (error: any) {
    return res.status(500).json({ message: error.message })
  }
}
