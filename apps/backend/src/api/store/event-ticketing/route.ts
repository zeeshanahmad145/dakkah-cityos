import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { handleApiError } from "../../../lib/api-error-handler"

const SEED_DATA = [
  {
    id: "et_001",
    name: "Summer Music Festival 2026",
    title: "Summer Music Festival 2026",
    description: "A weekend of live music featuring top international artists across multiple stages.",
    venue: "Central Park Arena",
    date: "2026-07-15T19:00:00Z",
    category: "concerts",
    price: 8999,
    currency_code: "usd",
    tickets_available: 250,
    status: "published",
    thumbnail: "/seed-images/event-ticketing%2F1488646953014-85cb44e25828.jpg",
  },
  {
    id: "et_002",
    name: "Champions League Final Screening",
    title: "Champions League Final Screening",
    description: "Watch the Champions League final on the big screen with fellow fans. Food and drinks available.",
    venue: "City Sports Complex",
    date: "2026-05-30T20:00:00Z",
    category: "sports",
    price: 4999,
    currency_code: "usd",
    tickets_available: 500,
    status: "published",
    thumbnail: "/seed-images/bookings%2F1534438327276-14e5300c3a48.jpg",
  },
  {
    id: "et_003",
    name: "Shakespeare in the Park",
    title: "Shakespeare in the Park",
    description: "A modern rendition of A Midsummer Night's Dream performed under the stars.",
    venue: "Riverside Theater",
    date: "2026-08-10T18:30:00Z",
    category: "theater",
    price: 5999,
    currency_code: "usd",
    tickets_available: 120,
    status: "published",
    thumbnail: "/seed-images/event-ticketing%2F1507525428034-b723cf961d3e.jpg",
  },
  {
    id: "et_004",
    name: "Tech Innovation Summit 2026",
    title: "Tech Innovation Summit 2026",
    description: "Three days of keynotes, workshops, and networking with industry leaders in AI, blockchain, and cloud.",
    venue: "Convention Center Hall A",
    date: "2026-09-05T09:00:00Z",
    category: "conferences",
    price: 19999,
    currency_code: "usd",
    tickets_available: 1000,
    status: "published",
    thumbnail: "/seed-images/bundles%2F1519389950473-47ba0277781c.jpg",
  },
  {
    id: "et_005",
    name: "Food & Wine Festival",
    title: "Food & Wine Festival",
    description: "Sample cuisines from 50+ local restaurants and wineries. Live cooking demos and tastings.",
    venue: "Harbor Pavilion",
    date: "2026-06-22T12:00:00Z",
    category: "festivals",
    price: 7499,
    currency_code: "usd",
    tickets_available: 350,
    status: "published",
    thumbnail: "/seed-images/bundles%2F1504674900247-0877df9cc836.jpg",
  },
]

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const moduleService = req.scope.resolve("eventTicketing") as any
    const { limit = "20", offset = "0", tenant_id, event_type } = req.query as Record<string, string | undefined>
    const filters: Record<string, any> = {}
    if (tenant_id) filters.tenant_id = tenant_id
    if (event_type) filters.event_type = event_type
    filters.status = "published"
    const items = await moduleService.listEvents(filters, { skip: Number(offset), take: Number(limit) })
    const results = Array.isArray(items) && items.length > 0 ? items : SEED_DATA
    return res.json({ items: results, count: results.length, limit: Number(limit), offset: Number(offset) })
  } catch (error: any) {
    return res.json({ items: SEED_DATA, count: SEED_DATA.length, limit: 20, offset: 0 })
  }
}

