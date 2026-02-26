import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "zod"
import { handleApiError } from "../../../lib/api-error-handler"
import { enrichListItems } from "../../../lib/detail-enricher"

const SEED_DATA = [
  {
    id: "rental_seed_1",
    tenant_id: "default",
    product_id: "prod_rental_1",
    rental_type: "daily",
    title: "Professional DSLR Camera Kit",
    name: "Professional DSLR Camera Kit",
    description: "Canon EOS R5 with 24-70mm f/2.8 lens, tripod, and carry case. Perfect for events, travel photography, and content creation.",
    daily_rate: 15000,
    weekly_rate: 75000,
    monthly_rate: 200000,
    deposit_amount: 50000,
    currency_code: "SAR",
    is_available: true,
    condition_on_listing: "Excellent",
    total_rentals: 48,
    category: "electronics",
    rating: 4.8,
    metadata: { thumbnail: "/seed-images/rentals/1516035069371-29a1b244cc32.jpg", price: 15000 },
    thumbnail: "/seed-images/rentals/1516035069371-29a1b244cc32.jpg",
    price: 15000,
  },
  {
    id: "rental_seed_2",
    tenant_id: "default",
    product_id: "prod_rental_2",
    rental_type: "daily",
    title: "Electric Scooter",
    name: "Electric Scooter",
    description: "Segway Ninebot Max G30 electric scooter with 65km range. Ideal for city commuting and sightseeing.",
    daily_rate: 5000,
    weekly_rate: 25000,
    monthly_rate: 70000,
    deposit_amount: 20000,
    currency_code: "SAR",
    is_available: true,
    condition_on_listing: "Good",
    total_rentals: 120,
    category: "vehicles",
    rating: 4.5,
    metadata: { thumbnail: "/seed-images/rentals/1516035069371-29a1b244cc32.jpg", price: 5000 },
    thumbnail: "/seed-images/rentals/1516035069371-29a1b244cc32.jpg",
    price: 5000,
  },
  {
    id: "rental_seed_3",
    tenant_id: "default",
    product_id: "prod_rental_3",
    rental_type: "weekly",
    title: "Camping & Outdoor Gear Set",
    name: "Camping & Outdoor Gear Set",
    description: "Complete camping package: 4-person tent, sleeping bags, portable stove, lantern, and cooler. Everything you need for a desert or mountain adventure.",
    daily_rate: 10000,
    weekly_rate: 50000,
    monthly_rate: 150000,
    deposit_amount: 30000,
    currency_code: "SAR",
    is_available: true,
    condition_on_listing: "Very Good",
    total_rentals: 65,
    category: "sports",
    rating: 4.6,
    metadata: { thumbnail: "/seed-images/rentals/1504280390367-361c6d9f38f4.jpg", price: 50000 },
    thumbnail: "/seed-images/rentals/1504280390367-361c6d9f38f4.jpg",
    price: 50000,
  },
  {
    id: "rental_seed_4",
    tenant_id: "default",
    product_id: "prod_rental_4",
    rental_type: "monthly",
    title: "Standing Desk & Ergonomic Chair",
    name: "Standing Desk & Ergonomic Chair",
    description: "Motorized sit-stand desk with Herman Miller Aeron chair. Transform your home office with premium ergonomic furniture.",
    daily_rate: 8000,
    weekly_rate: 40000,
    monthly_rate: 120000,
    deposit_amount: 40000,
    currency_code: "SAR",
    is_available: true,
    condition_on_listing: "Excellent",
    total_rentals: 32,
    category: "furniture",
    rating: 4.9,
    metadata: { thumbnail: "/seed-images/classifieds/1593062096033-9a26b09da705.jpg", price: 120000 },
    thumbnail: "/seed-images/classifieds/1593062096033-9a26b09da705.jpg",
    price: 120000,
  },
  {
    id: "rental_seed_5",
    tenant_id: "default",
    product_id: "prod_rental_5",
    rental_type: "daily",
    title: "Power Tools Construction Kit",
    name: "Power Tools Construction Kit",
    description: "DeWalt professional toolkit with drill, circular saw, reciprocating saw, and impact driver. Includes batteries and charger.",
    daily_rate: 12000,
    weekly_rate: 60000,
    monthly_rate: 180000,
    deposit_amount: 35000,
    currency_code: "SAR",
    is_available: true,
    condition_on_listing: "Good",
    total_rentals: 87,
    category: "tools",
    rating: 4.7,
    metadata: { thumbnail: "/seed-images/rentals/1504148455328-c376907d081c.jpg", price: 12000 },
    thumbnail: "/seed-images/rentals/1504148455328-c376907d081c.jpg",
    price: 12000,
  },
]

const createRentalSchema = z.object({
  tenant_id: z.string().min(1).optional(),
  product_id: z.string().min(1).optional(),
  rental_type: z.string().min(1).optional(),
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  daily_rate: z.number().optional(),
  weekly_rate: z.number().optional(),
  monthly_rate: z.number().optional(),
  deposit_amount: z.number().optional(),
  currency_code: z.string().optional(),
  is_available: z.boolean().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
})

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const mod = req.scope.resolve("rental") as any
    const { limit = "20", offset = "0", tenant_id, rental_type } = req.query as Record<string, string | undefined>
    const filters: Record<string, any> = {}
    if (tenant_id) filters.tenant_id = tenant_id
    if (rental_type) filters.rental_type = rental_type
    filters.is_available = true
    const dbItems = await mod.listRentalProducts(filters, { skip: Number(offset), take: Number(limit) })
    const raw = Array.isArray(dbItems) && dbItems.length > 0 ? dbItems : SEED_DATA
    const items = enrichListItems(raw, "rentals")
    return res.json({ items, count: items.length, limit: Number(limit), offset: Number(offset) })
  } catch (error: any) {
    handleApiError(res, error, "STORE-RENTALS")}
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const customerId = (req as any).auth_context?.actor_id
    if (!customerId) {
      return res.status(401).json({ message: "Authentication required" })
    }

    const parsed = createRentalSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ message: "Validation failed", errors: parsed.error.issues })
    }

    const mod = req.scope.resolve("rental") as any
    const item = await mod.createRentalProducts(parsed.data)
    res.status(201).json({ item })
  } catch (error: any) {
    return handleApiError(res, error, "STORE-RENTALS")}
}
