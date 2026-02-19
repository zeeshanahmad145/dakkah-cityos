import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "zod"
import { handleApiError } from "../../../../lib/api-error-handler"

const updateSchema = z.object({
  listing_type: z.enum(["sale", "lease", "auction"]).optional(),
  title: z.string().optional(),
  make: z.string().optional(),
  model_name: z.string().optional(),
  year: z.number().optional(),
  mileage_km: z.number().optional(),
  fuel_type: z.enum(["petrol", "diesel", "electric", "hybrid", "hydrogen"]).optional(),
  transmission: z.enum(["automatic", "manual", "cvt"]).optional(),
  body_type: z.enum(["sedan", "suv", "hatchback", "truck", "van", "coupe", "convertible", "wagon"]).optional(),
  color: z.string().optional(),
  vin: z.string().optional(),
  condition: z.enum(["new", "certified_pre_owned", "used", "salvage"]).optional(),
  price: z.number().optional(),
  currency_code: z.string().optional(),
  description: z.string().optional(),
  features: z.any().optional(),
  images: z.any().optional(),
  location_city: z.string().optional(),
  location_country: z.string().optional(),
  status: z.enum(["draft", "active", "reserved", "sold", "withdrawn"]).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
}).passthrough()

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const mod = req.scope.resolve("automotive") as any
  const { id } = req.params
  const [item] = await mod.listVehicleListings({ id }, { take: 1 })
  if (!item) return res.status(404).json({ message: "Not found" })
  return res.json({ item })
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const mod = req.scope.resolve("automotive") as any
  const { id } = req.params
  const validation = updateSchema.safeParse(req.body)
  if (!validation.success) return res.status(400).json({ message: "Validation failed", errors: validation.error.issues })
  const item = await mod.updateVehicleListings({ id, ...validation.data })
  return res.json({ item })
}

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  const mod = req.scope.resolve("automotive") as any
  const { id } = req.params
  await mod.deleteVehicleListings([id])
  return res.status(204).send()
}

