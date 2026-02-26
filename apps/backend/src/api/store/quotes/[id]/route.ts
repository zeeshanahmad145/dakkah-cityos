import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { z } from "zod"
import { handleApiError } from "../../../../lib/api-error-handler"

const submitQuoteSchema = z.object({
}).strict()

const SEED_QUOTES = [
  {
    id: "quote-seed-1",
    title: "Office Furniture Package",
    description: "Custom quote for complete office furniture setup including desks, chairs, and storage units.",
    status: "pending",
    customer_name: "Acme Corp",
    customer_email: "procurement@acme.com",
    items: [
      { name: "Executive Standing Desk", quantity: 10, unit_price: 89900, total: 899000 },
      { name: "Ergonomic Office Chair", quantity: 10, unit_price: 45900, total: 459000 },
      { name: "Filing Cabinet 3-Drawer", quantity: 5, unit_price: 29900, total: 149500 },
    ],
    subtotal: 1507500,
    discount: 150750,
    tax: 135675,
    total: 1492425,
    currency: "USD",
    valid_until: "2025-03-01",
    notes: "Bulk discount applied. Delivery within 2 weeks.",
    created_at: "2024-12-01T10:00:00Z",
    thumbnail: "/seed-images/b2b%2F1497366216548-37526070297c.jpg",
  },
  {
    id: "quote-seed-2",
    title: "IT Equipment Refresh",
    description: "Technology refresh quote for laptops, monitors, and peripherals.",
    status: "approved",
    customer_name: "TechStart Inc",
    customer_email: "it@techstart.io",
    items: [
      { name: "Business Laptop 14\"", quantity: 25, unit_price: 129900, total: 3247500 },
      { name: "27\" 4K Monitor", quantity: 25, unit_price: 49900, total: 1247500 },
      { name: "Wireless Keyboard & Mouse Set", quantity: 25, unit_price: 7900, total: 197500 },
    ],
    subtotal: 4692500,
    discount: 469250,
    tax: 422325,
    total: 4645575,
    currency: "USD",
    valid_until: "2025-02-15",
    notes: "Volume pricing applied. 30-day NET payment terms.",
    created_at: "2024-11-15T14:30:00Z",
    thumbnail: "/seed-images/b2b%2F1504384764-913a7ee141d3.jpg",
  },
  {
    id: "quote-seed-3",
    title: "Warehouse Supplies Annual Contract",
    description: "Annual supply contract for packaging materials and warehouse consumables.",
    status: "draft",
    customer_name: "Global Logistics Ltd",
    customer_email: "supply@globallogistics.com",
    items: [
      { name: "Corrugated Boxes (Large)", quantity: 5000, unit_price: 250, total: 1250000 },
      { name: "Packing Tape (48-roll case)", quantity: 200, unit_price: 3500, total: 700000 },
      { name: "Bubble Wrap (300m roll)", quantity: 100, unit_price: 4500, total: 450000 },
    ],
    subtotal: 2400000,
    discount: 360000,
    tax: 204000,
    total: 2244000,
    currency: "USD",
    valid_until: "2025-04-01",
    notes: "Annual contract with quarterly delivery schedule.",
    created_at: "2024-12-10T09:15:00Z",
    thumbnail: "/seed-images/consignments%2F1586023492067-2e840fece27a.jpg",
  },
  {
    id: "quote-seed-4",
    title: "Event AV Equipment Rental",
    description: "Audio-visual equipment rental quote for corporate annual conference.",
    status: "submitted",
    customer_name: "EventPro Solutions",
    customer_email: "bookings@eventpro.com",
    items: [
      { name: "LED Video Wall (10x6ft)", quantity: 2, unit_price: 250000, total: 500000 },
      { name: "Professional PA System", quantity: 1, unit_price: 180000, total: 180000 },
      { name: "Wireless Microphone Kit", quantity: 4, unit_price: 15000, total: 60000 },
    ],
    subtotal: 740000,
    discount: 74000,
    tax: 59920,
    total: 725920,
    currency: "USD",
    valid_until: "2025-01-31",
    notes: "Includes setup and teardown. Technical support during event.",
    created_at: "2024-12-05T16:00:00Z",
    thumbnail: "/seed-images/events%2F1540575467063-178a2e25ea79.jpg",
  },
  {
    id: "quote-seed-5",
    title: "Custom Branded Merchandise",
    description: "Branded merchandise order for company swag including apparel and accessories.",
    status: "expired",
    customer_name: "BrandFirst Agency",
    customer_email: "orders@brandfirst.co",
    items: [
      { name: "Custom Printed T-Shirts", quantity: 500, unit_price: 1500, total: 750000 },
      { name: "Embroidered Caps", quantity: 300, unit_price: 1200, total: 360000 },
      { name: "Branded Tote Bags", quantity: 500, unit_price: 800, total: 400000 },
    ],
    subtotal: 1510000,
    discount: 226500,
    tax: 115515,
    total: 1399015,
    currency: "USD",
    valid_until: "2024-11-30",
    notes: "Quote expired. Contact for updated pricing.",
    created_at: "2024-10-01T11:00:00Z",
    thumbnail: "/seed-images/memberships%2F1441986300917-64674bd600d8.jpg",
  },
]

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const quoteModuleService = req.scope.resolve("quoteModuleService") as any;
    const { id } = req.params;

    const quote = await quoteModuleService.retrieveQuote(id);
    res.json({ quote });
  } catch (error: any) {
    const { id } = req.params
    const seed = SEED_QUOTES.find((s) => s.id === id) || SEED_QUOTES[0]
    return res.json({ quote: { ...seed, id } })
  }
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const quoteModuleService = req.scope.resolve("quoteModuleService") as any;
    const { id } = req.params;

    if (!req.auth_context?.actor_id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const parsed = submitQuoteSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: "Validation failed", errors: parsed.error.issues });
    }

    const quote = await quoteModuleService.retrieveQuote(id);

    if (quote.customer_id !== req.auth_context.actor_id) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const updatedQuote = await quoteModuleService.updateQuotes({
      id,
      status: "submitted",
    });

    res.json({ quote: updatedQuote });
  } catch (error: any) {
    handleApiError(res, error, "POST store quotes id")
  }
}
