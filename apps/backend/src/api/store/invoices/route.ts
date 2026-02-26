import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

const SEED_INVOICES = [
  {
    id: "invoice-seed-1",
    invoice_number: "INV-2025-0001",
    customer_name: "Acme Corporation",
    total: 4500000,
    currency: "USD",
    status: "paid",
    issued_at: "2025-03-01T00:00:00Z",
    due_date: "2025-03-31T00:00:00Z",
    paid_at: "2025-03-28T00:00:00Z",
    thumbnail: "/seed-images/b2b%2F1486406146926-c627a92ad1ab.jpg",
    line_items: [
      { description: "Enterprise Software License", quantity: 1, unit_price: 3000000, total: 3000000 },
      { description: "Implementation Services", quantity: 10, unit_price: 150000, total: 1500000 },
    ],
  },
  {
    id: "invoice-seed-2",
    invoice_number: "INV-2025-0002",
    customer_name: "TechStart Solutions",
    total: 1250000,
    currency: "USD",
    status: "pending",
    issued_at: "2025-04-15T00:00:00Z",
    due_date: "2025-05-15T00:00:00Z",
    paid_at: null,
    thumbnail: "/seed-images/b2b%2F1504384308090-c894fdcc538d.jpg",
    line_items: [
      { description: "Cloud Hosting - Annual", quantity: 1, unit_price: 1000000, total: 1000000 },
      { description: "Support Package", quantity: 1, unit_price: 250000, total: 250000 },
    ],
  },
  {
    id: "invoice-seed-3",
    invoice_number: "INV-2025-0003",
    customer_name: "Global Logistics Ltd",
    total: 8750000,
    currency: "USD",
    status: "paid",
    issued_at: "2025-02-10T00:00:00Z",
    due_date: "2025-03-10T00:00:00Z",
    paid_at: "2025-03-08T00:00:00Z",
    thumbnail: "/seed-images/consignments%2F1548036328-c9fa89d128fa.jpg",
    line_items: [
      { description: "Freight Management System", quantity: 1, unit_price: 5000000, total: 5000000 },
      { description: "GPS Tracking Hardware", quantity: 50, unit_price: 75000, total: 3750000 },
    ],
  },
  {
    id: "invoice-seed-4",
    invoice_number: "INV-2025-0004",
    customer_name: "Green Earth Supplies",
    total: 620000,
    currency: "USD",
    status: "overdue",
    issued_at: "2025-01-20T00:00:00Z",
    due_date: "2025-02-20T00:00:00Z",
    paid_at: null,
    thumbnail: "/seed-images/charity%2F1469571486292-0ba58a3f068b.jpg",
    line_items: [
      { description: "Eco-Packaging Materials", quantity: 500, unit_price: 1000, total: 500000 },
      { description: "Shipping & Handling", quantity: 1, unit_price: 120000, total: 120000 },
    ],
  },
  {
    id: "invoice-seed-5",
    invoice_number: "INV-2025-0005",
    customer_name: "MediSupply Corp",
    total: 3200000,
    currency: "USD",
    status: "paid",
    issued_at: "2025-04-01T00:00:00Z",
    due_date: "2025-05-01T00:00:00Z",
    paid_at: "2025-04-25T00:00:00Z",
    thumbnail: "/seed-images/healthcare%2F1551836022-d5d88e9218df.jpg",
    line_items: [
      { description: "Medical Equipment - Diagnostic", quantity: 2, unit_price: 1200000, total: 2400000 },
      { description: "Consumable Supplies", quantity: 1, unit_price: 800000, total: 800000 },
    ],
  },
]

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const invoiceService = req.scope.resolve("invoiceModuleService") as any

    if (!req.auth_context?.actor_id) {
      return res.json({ invoices: SEED_INVOICES, count: SEED_INVOICES.length })
    }

    const invoices = await invoiceService.listInvoices({}, { take: 20 })
    const results = Array.isArray(invoices) && invoices.length > 0 ? invoices : SEED_INVOICES
    return res.json({ invoices: results, count: results.length })
  } catch (error: any) {
    return res.json({ invoices: SEED_INVOICES, count: SEED_INVOICES.length })
  }
}
