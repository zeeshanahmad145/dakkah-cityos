import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "zod"
import { handleApiError } from "../../../lib/api-error-handler"

const SEED_DATA = [
  {
    id: "auction_seed_1",
    tenant_id: "default",
    product_id: "prod_auction_1",
    title: "Luxury Swiss Chronograph Watch",
    description: "Rare limited-edition Swiss-made chronograph with sapphire crystal, 18K gold case, and automatic movement. Complete with original box and papers.",
    auction_type: "english",
    status: "active",
    starting_price: 250000,
    reserve_price: 500000,
    current_price: 375000,
    currency_code: "SAR",
    bid_increment: 5000,
    bid_count: 12,
    total_bids: 12,
    starts_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    ends_at: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(),
    metadata: { thumbnail: "https://images.unsplash.com/photo-1523170335258-f5ed11844a49?w=800&h=600&fit=crop" },
    thumbnail: "https://images.unsplash.com/photo-1523170335258-f5ed11844a49?w=800&h=600&fit=crop",
  },
  {
    id: "auction_seed_2",
    tenant_id: "default",
    product_id: "prod_auction_2",
    title: "Original Abstract Oil Painting",
    description: "Stunning vintage abstract expressionist oil on canvas from the 1960s. Gallery-quality framing included. Authenticated by leading art experts.",
    auction_type: "english",
    status: "active",
    starting_price: 150000,
    reserve_price: 300000,
    current_price: 220000,
    currency_code: "SAR",
    bid_increment: 10000,
    bid_count: 8,
    total_bids: 8,
    starts_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    ends_at: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    metadata: { thumbnail: "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=800&h=600&fit=crop" },
    thumbnail: "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=800&h=600&fit=crop",
  },
  {
    id: "auction_seed_3",
    tenant_id: "default",
    product_id: "prod_auction_3",
    title: "1967 Classic Muscle Car",
    description: "Fully restored classic American muscle car with matching numbers engine, original interior, and show-quality paint. A true collector's dream.",
    auction_type: "reserve",
    status: "active",
    starting_price: 800000,
    reserve_price: 1500000,
    current_price: 1100000,
    currency_code: "SAR",
    bid_increment: 25000,
    bid_count: 15,
    total_bids: 15,
    starts_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    ends_at: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    metadata: { thumbnail: "https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=800&h=600&fit=crop" },
    thumbnail: "https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=800&h=600&fit=crop",
  },
  {
    id: "auction_seed_4",
    tenant_id: "default",
    product_id: "prod_auction_4",
    title: "Rare Diamond & Emerald Necklace",
    description: "Exquisite 18K white gold necklace featuring 5 carats of VS1 diamonds and Colombian emeralds. Includes GIA certification and luxury case.",
    auction_type: "sealed",
    status: "active",
    starting_price: 400000,
    reserve_price: 750000,
    current_price: 520000,
    currency_code: "SAR",
    bid_increment: 15000,
    bid_count: 6,
    total_bids: 6,
    starts_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    ends_at: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString(),
    metadata: { thumbnail: "https://images.unsplash.com/photo-1515562141589-67f0d569b6c7?w=800&h=600&fit=crop" },
    thumbnail: "https://images.unsplash.com/photo-1515562141589-67f0d569b6c7?w=800&h=600&fit=crop",
  },
  {
    id: "auction_seed_5",
    tenant_id: "default",
    product_id: "prod_auction_5",
    title: "Ancient Gold Coin Collection",
    description: "Museum-quality collection of 12 ancient gold coins spanning Roman, Byzantine, and Islamic periods. Each coin individually graded and certified.",
    auction_type: "dutch",
    status: "active",
    starting_price: 600000,
    reserve_price: 400000,
    current_price: 480000,
    currency_code: "SAR",
    bid_increment: 10000,
    bid_count: 4,
    total_bids: 4,
    starts_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    ends_at: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    metadata: { thumbnail: "https://images.unsplash.com/photo-1610375228550-d5cabc1d4090?w=800&h=600&fit=crop" },
    thumbnail: "https://images.unsplash.com/photo-1610375228550-d5cabc1d4090?w=800&h=600&fit=crop",
  },
]

const createAuctionListingSchema = z.object({
  tenant_id: z.string().min(1),
  product_id: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional(),
  auction_type: z.enum(["english", "dutch", "sealed", "reserve"]),
  status: z.enum(["draft", "scheduled", "active", "ended", "cancelled"]).optional(),
  starting_price: z.number(),
  reserve_price: z.number().optional(),
  buy_now_price: z.number().optional(),
  current_price: z.number().optional(),
  currency_code: z.string().min(1),
  bid_increment: z.number(),
  starts_at: z.string().min(1),
  ends_at: z.string().min(1),
  auto_extend: z.boolean().optional(),
  extend_minutes: z.number().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
})

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const mod = req.scope.resolve("auction") as any
    const { limit = "20", offset = "0", tenant_id, auction_type } = req.query as Record<string, string | undefined>
    const filters: Record<string, any> = {}
    if (tenant_id) filters.tenant_id = tenant_id
    if (auction_type) filters.auction_type = auction_type
    filters.status = "active"
    const dbItems = await mod.listAuctionListings(filters, { skip: Number(offset), take: Number(limit) })
    const items = Array.isArray(dbItems) && dbItems.length > 0 ? dbItems : SEED_DATA
    return res.json({ items, count: items.length, limit: Number(limit), offset: Number(offset) })
  } catch (error: any) {
    handleApiError(res, error, "STORE-AUCTIONS")}
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const customerId = (req as any).auth_context?.actor_id
    if (!customerId) {
      return res.status(401).json({ message: "Authentication required" })
    }

    const parsed = createAuctionListingSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ message: "Validation failed", errors: parsed.error.issues })
    }

    const mod = req.scope.resolve("auction") as any
    const item = await mod.createAuctionListings(parsed.data)
    res.status(201).json({ item })
  } catch (error: any) {
    return handleApiError(res, error, "STORE-AUCTIONS")}
}
