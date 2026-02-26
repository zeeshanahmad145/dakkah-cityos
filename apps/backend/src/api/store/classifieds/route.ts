import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "zod"
import { handleApiError } from "../../../lib/api-error-handler"
import { sanitizeList } from "../../../lib/image-sanitizer"

const SEED_CLASSIFIEDS = [
  {
    id: "cls-1",
    title: "iPhone 15 Pro Max – 256GB, Like New",
    description: "Barely used iPhone 15 Pro Max in Natural Titanium. Comes with original box, charger, and AppleCare+ until 2026. No scratches or dents.",
    category_id: "electronics",
    listing_type: "sale",
    condition: "like_new",
    price: 380000,
    currency_code: "SAR",
    is_negotiable: true,
    location_city: "Riyadh",
    status: "active",
    metadata: { thumbnail: "/seed-images/classifieds%2F1592750475338-74b7b21085ab.jpg", images: ["/seed-images/classifieds%2F1592750475338-74b7b21085ab.jpg"] },
  },
  {
    id: "cls-2",
    title: "Leather Sectional Sofa – Italian Design",
    description: "Beautiful Italian leather L-shaped sectional sofa in dark brown. Seats 6 comfortably. Moving sale – must go this week!",
    category_id: "furniture",
    listing_type: "sale",
    condition: "good",
    price: 250000,
    currency_code: "SAR",
    is_negotiable: true,
    location_city: "Jeddah",
    status: "active",
    metadata: { thumbnail: "/seed-images/classifieds%2F1555041469-a586c61ea9bc.jpg", images: ["/seed-images/classifieds%2F1555041469-a586c61ea9bc.jpg"] },
  },
  {
    id: "cls-3",
    title: "2022 Toyota Camry – Low Mileage",
    description: "Single-owner 2022 Toyota Camry Grande with only 18,000 km. Full service history, extended warranty, pearl white color.",
    category_id: "vehicles",
    listing_type: "sale",
    condition: "like_new",
    price: 8500000,
    currency_code: "SAR",
    is_negotiable: false,
    location_city: "Dammam",
    status: "active",
    metadata: { thumbnail: "/seed-images/classifieds%2F1621007947382-bb3c3994e3fb.jpg", images: ["/seed-images/classifieds%2F1621007947382-bb3c3994e3fb.jpg"] },
  },
  {
    id: "cls-4",
    title: "MacBook Pro M3 14\" – Brand New Sealed",
    description: "Brand new, sealed MacBook Pro 14-inch with M3 chip, 18GB RAM, 512GB SSD. Space Black. Selling because received as a duplicate gift.",
    category_id: "electronics",
    listing_type: "sale",
    condition: "new",
    price: 620000,
    currency_code: "SAR",
    is_negotiable: true,
    location_city: "Riyadh",
    status: "active",
    metadata: { thumbnail: "/seed-images/classifieds%2F1517336714731-489689fd1ca8.jpg", images: ["/seed-images/classifieds%2F1517336714731-489689fd1ca8.jpg"] },
  },
  {
    id: "cls-5",
    title: "Vintage Oud Collection – 3 Pieces",
    description: "Three beautiful vintage oud instruments from different regions. Perfect for collectors or musicians. Each piece has unique craftsmanship.",
    category_id: "collectibles",
    listing_type: "sale",
    condition: "good",
    price: 450000,
    currency_code: "SAR",
    is_negotiable: true,
    location_city: "Madinah",
    status: "active",
    metadata: { thumbnail: "/seed-images/classifieds%2F1511379938547-c1f69419868d.jpg", images: ["/seed-images/classifieds%2F1511379938547-c1f69419868d.jpg"] },
  },
  {
    id: "cls-6",
    title: "Looking for: Standing Desk – Adjustable",
    description: "Looking to buy a quality adjustable standing desk in good condition. Preferably electric height adjustment. Budget up to 1,500 SAR.",
    category_id: "furniture",
    listing_type: "wanted",
    condition: "good",
    price: 150000,
    currency_code: "SAR",
    is_negotiable: true,
    location_city: "Riyadh",
    status: "active",
    metadata: { thumbnail: "/seed-images/classifieds%2F1593062096033-9a26b09da705.jpg", images: ["/seed-images/classifieds%2F1593062096033-9a26b09da705.jpg"] },
  },
]

const createClassifiedSchema = z.object({
  tenant_id: z.string().min(1),
  seller_id: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  category_id: z.string().nullable().optional(),
  subcategory_id: z.string().nullable().optional(),
  listing_type: z.enum(["sell", "buy", "trade", "free", "wanted"]),
  condition: z.enum(["new", "like_new", "good", "fair", "poor"]).optional(),
  price: z.union([z.string(), z.number()]).nullable().optional(),
  currency_code: z.string().min(1),
  is_negotiable: z.boolean().optional(),
  location_city: z.string().nullable().optional(),
  location_state: z.string().nullable().optional(),
  location_country: z.string().nullable().optional(),
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
  status: z.enum(["draft", "active", "sold", "expired", "flagged", "removed"]).optional(),
  expires_at: z.string().nullable().optional(),
  promoted_until: z.string().nullable().optional(),
  metadata: z.record(z.string(), z.unknown()).nullable().optional(),
})

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const mod = req.scope.resolve("classified") as any
    const {
      limit = "20",
      offset = "0",
      tenant_id,
      category,
      location,
      min_price,
      max_price,
      condition,
      search,
    } = req.query as Record<string, string | undefined>

    const filters: Record<string, any> = {}
    if (tenant_id) filters.tenant_id = tenant_id
    if (category) filters.category = category
    if (location) filters.location = location
    if (min_price) filters.min_price = Number(min_price)
    if (max_price) filters.max_price = Number(max_price)
    if (condition) filters.condition = condition
    if (search) filters.search = search
    filters.status = "active"

    const items = await mod.listClassifiedListings(filters, { skip: Number(offset), take: Number(limit) })
    const rawList = Array.isArray(items) && items.length > 0 ? items : SEED_CLASSIFIEDS
    const itemList = sanitizeList(rawList, "classifieds")
    return res.json({
      items: itemList,
      count: itemList.length,
      limit: Number(limit),
      offset: Number(offset),
    })
  } catch (error: any) {
    return res.json({ items: SEED_CLASSIFIEDS, count: SEED_CLASSIFIEDS.length, limit: 20, offset: 0 })
  }
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const customerId = (req as any).auth_context?.actor_id
    if (!customerId) {
      return res.status(401).json({ message: "Authentication required" })
    }

    const parsed = createClassifiedSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ message: "Validation failed", errors: parsed.error.issues })
    }

    const mod = req.scope.resolve("classified") as any
    const item = await mod.createClassifiedListings(parsed.data)
    res.status(201).json({ item })
  } catch (error: any) {
    return handleApiError(res, error, "STORE-CLASSIFIEDS")}
}

