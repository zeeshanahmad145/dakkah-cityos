import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "zod"
import { handleApiError } from "../../../lib/api-error-handler"

const createVehicleListingSchema = z.object({
  tenant_id: z.string().min(1),
  seller_id: z.string().min(1),
  listing_type: z.enum(["sale", "lease", "auction"]),
  title: z.string().min(1),
  make: z.string().min(1),
  model_name: z.string().min(1),
  year: z.number(),
  mileage_km: z.number().optional(),
  fuel_type: z.enum(["petrol", "diesel", "electric", "hybrid", "hydrogen"]).optional(),
  transmission: z.enum(["automatic", "manual", "cvt"]).optional(),
  body_type: z.enum(["sedan", "suv", "hatchback", "truck", "van", "coupe", "convertible", "wagon"]).optional(),
  color: z.string().optional(),
  vin: z.string().optional(),
  condition: z.enum(["new", "certified_pre_owned", "used", "salvage"]).optional(),
  price: z.number(),
  currency_code: z.string().min(1),
  description: z.string().optional(),
  features: z.array(z.string()).optional(),
  images: z.array(z.string()).optional(),
  location_city: z.string().optional(),
  location_country: z.string().optional(),
  status: z.enum(["draft", "active", "reserved", "sold", "withdrawn"]).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
})

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const mod = req.scope.resolve("automotive") as any
    const {
      limit = "20",
      offset = "0",
      tenant_id,
      make,
      model,
      year,
      condition,
      min_price,
      max_price,
      fuel_type,
      transmission,
      search,
    } = req.query as Record<string, string | undefined>

    const filters: Record<string, any> = {}
    if (tenant_id) filters.tenant_id = tenant_id
    if (make) filters.make = make
    if (model) filters.model = model
    if (year) filters.year = Number(year)
    if (condition) filters.condition = condition
    if (min_price) filters.min_price = Number(min_price)
    if (max_price) filters.max_price = Number(max_price)
    if (fuel_type) filters.fuel_type = fuel_type
    if (transmission) filters.transmission = transmission
    if (search) filters.search = search

    const items = await mod.listVehicleListings(filters, { skip: Number(offset), take: Number(limit) })
    return res.json({
      items,
      count: Array.isArray(items) ? items.length : 0,
      limit: Number(limit),
      offset: Number(offset),
    })
  } catch (error: any) {
    handleApiError(res, error, "STORE-AUTOMOTIVE")}
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const customerId = (req as any).auth_context?.actor_id
    if (!customerId) {
      return res.status(401).json({ message: "Authentication required" })
    }

    const parsed = createVehicleListingSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ message: "Validation failed", errors: parsed.error.issues })
    }

    const mod = req.scope.resolve("automotive") as any
    const item = await mod.createVehicleListings(parsed.data)
    res.status(201).json({ item })
  } catch (error: any) {
    return handleApiError(res, error, "STORE-AUTOMOTIVE")}
}
