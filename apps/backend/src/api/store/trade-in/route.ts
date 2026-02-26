import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "zod"
import { handleApiError } from "../../../lib/api-error-handler"

const SEED_ITEMS = [
  {
    id: "ti-seed-1",
    name: "iPhone 15 Pro",
    category: "phones",
    thumbnail: "/seed-images/auctions/1523275335684-37898b6baf30.jpg",
    description: "Trade in your iPhone 15 Pro for store credit. All storage sizes accepted.",
    condition_requirements: "Powers on, no cracks, iCloud unlocked",
    trade_in_min: 35000,
    trade_in_max: 65000,
  },
  {
    id: "ti-seed-2",
    name: "MacBook Pro 14\"",
    category: "laptops",
    thumbnail: "/seed-images/digital-products/1517694712202-14dd9538aa97.jpg",
    description: "Trade in your MacBook Pro for instant credit. M1, M2, and M3 models accepted.",
    condition_requirements: "Functional display, keyboard works, no water damage",
    trade_in_min: 45000,
    trade_in_max: 120000,
  },
  {
    id: "ti-seed-3",
    name: "iPad Air / Pro",
    category: "tablets",
    thumbnail: "/seed-images/auctions/1505740420928-5e560c06d30e.jpg",
    description: "Get credit for your used iPad. All generations and sizes welcome.",
    condition_requirements: "Screen intact, charges properly, factory reset",
    trade_in_min: 15000,
    trade_in_max: 55000,
  },
  {
    id: "ti-seed-4",
    name: "PlayStation 5",
    category: "gaming",
    thumbnail: "/seed-images/trade-in/1593642532744-d377ab507dc8.jpg",
    description: "Trade your PS5 console for credit towards new gaming gear.",
    condition_requirements: "Disc drive works (if applicable), controller included",
    trade_in_min: 20000,
    trade_in_max: 35000,
  },
  {
    id: "ti-seed-5",
    name: "Samsung Galaxy S24 Ultra",
    category: "phones",
    thumbnail: "/seed-images/trade-in/1542291026-7eec264c27ff.jpg",
    description: "Trade in your Galaxy S24 Ultra. Unlocked and carrier models accepted.",
    condition_requirements: "Screen works, no cracks, Google account removed",
    trade_in_min: 30000,
    trade_in_max: 55000,
  },
]

const createTradeInSchema = z.object({
  tenant_id: z.string().min(1),
  listing_id: z.string().optional(),
  make: z.string().min(1),
  model_name: z.string().min(1),
  year: z.number(),
  mileage_km: z.number(),
  condition: z.string().min(1),
  vin: z.string().optional(),
  description: z.string().optional(),
  photos: z.array(z.string()).optional(),
  currency_code: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
})

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const customerId = req.auth_context?.actor_id

  if (!customerId) {
    return res.json({
      trade_ins: [],
      items: SEED_ITEMS,
      count: SEED_ITEMS.length,
      limit: 20,
      offset: 0,
      public_info: {
        eligible_categories: [
          { name: "Electronics", description: "Smartphones, laptops, tablets and more", estimated_value_range: "$50 - $800", thumbnail: "/seed-images/bundles/1519389950473-47ba0277781c.jpg" },
          { name: "Automotive", description: "Vehicles, parts, and accessories", estimated_value_range: "$100 - $25000", thumbnail: "/seed-images/auctions/1489824904134-891ab64532f1.jpg" },
          { name: "Furniture", description: "Home and office furniture", estimated_value_range: "$25 - $500", thumbnail: "/seed-images/classifieds/1555041469-a586c61ea9bc.jpg" },
          { name: "Appliances", description: "Home appliances in working condition", estimated_value_range: "$30 - $400", thumbnail: "/seed-images/trade-in/1524758631624-e2822e304c36.jpg" },
        ],
        how_it_works: [
          "Submit your item details and photos",
          "Receive a trade-in value estimate",
          "Ship your item or drop it off",
          "Get credit applied to your account",
        ],
      },
    })
  }

  const { limit = "20", offset = "0", tenant_id, status } = req.query as Record<string, string | undefined>

  try {
    const automotiveService = req.scope.resolve("automotive") as any

    const filters: Record<string, any> = { customer_id: customerId }
    if (tenant_id) filters.tenant_id = tenant_id
    if (status) filters.status = status

    const items = await automotiveService.listTradeIns(filters, {
      skip: Number(offset),
      take: Number(limit),
      order: { created_at: "DESC" },
    })

    const tradeIns = Array.isArray(items) ? items : [items].filter(Boolean)

    res.json({
      trade_ins: tradeIns,
      count: tradeIns.length,
      limit: Number(limit),
      offset: Number(offset),
    })
  } catch (error: any) {
    handleApiError(res, error, "STORE-TRADE-IN")}
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const customerId = req.auth_context?.actor_id

  if (!customerId) {
    return res.status(401).json({ message: "Authentication required" })
  }

  const parsed = createTradeInSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ message: "Validation failed", errors: parsed.error.issues })
  }

  const {
    tenant_id,
    listing_id,
    make,
    model_name,
    year,
    mileage_km,
    condition,
    vin,
    description,
    photos,
    currency_code = "usd",
    metadata,
  } = parsed.data

  try {
    const automotiveService = req.scope.resolve("automotive") as any

    const tradeIn = await (automotiveService as any).createTradeIns({
      tenant_id,
      customer_id: customerId,
      listing_id: listing_id || null,
      make,
      model_name,
      year,
      mileage_km,
      condition,
      vin: vin || null,
      description: description || null,
      photos: photos || null,
      currency_code,
      status: "submitted",
      metadata: metadata || null,
    })

    res.status(201).json({ trade_in: tradeIn })
  } catch (error: any) {
    handleApiError(res, error, "STORE-TRADE-IN")}
}
