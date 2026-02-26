import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

const SEED_DATA = [
  {
    id: "vehicle-seed-1",
    make: "Toyota",
    model: "Camry",
    year: 2024,
    price: 2899900,
    currency: "USD",
    mileage: 15200,
    fuel_type: "hybrid",
    transmission: "automatic",
    condition: "certified-pre-owned",
    thumbnail: "/seed-images/automotive%2F1556189250-72ba954cfc2b.jpg",
  },
  {
    id: "vehicle-seed-2",
    make: "Tesla",
    model: "Model 3",
    year: 2025,
    price: 4299900,
    currency: "USD",
    mileage: 0,
    fuel_type: "electric",
    transmission: "automatic",
    condition: "new",
    thumbnail: "/seed-images/automotive%2F1621993202323-f438eec934ff.jpg",
  },
  {
    id: "vehicle-seed-3",
    make: "Honda",
    model: "CR-V",
    year: 2024,
    price: 3499900,
    currency: "USD",
    mileage: 8500,
    fuel_type: "gasoline",
    transmission: "automatic",
    condition: "certified-pre-owned",
    thumbnail: "/seed-images/automotive%2F1568605117036-5fe5e7bab0b7.jpg",
  },
  {
    id: "vehicle-seed-4",
    make: "BMW",
    model: "X5",
    year: 2025,
    price: 6599900,
    currency: "USD",
    mileage: 0,
    fuel_type: "hybrid",
    transmission: "automatic",
    condition: "new",
    thumbnail: "/seed-images/automotive%2F1632245889029-e406faaa34cd.jpg",
  },
  {
    id: "vehicle-seed-5",
    make: "Ford",
    model: "F-150",
    year: 2024,
    price: 4899900,
    currency: "USD",
    mileage: 22000,
    fuel_type: "gasoline",
    transmission: "automatic",
    condition: "used",
    thumbnail: "/seed-images/automotive%2F1618843479313-40f8afb4b4d8.jpg",
  },
]

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const automotiveService = req.scope.resolve("automotive") as any
    const { limit = "20", offset = "0" } = req.query as Record<string, string | undefined>
    const items = await automotiveService.listAutomotiveListings({}, { skip: Number(offset), take: Number(limit) })
    const results = Array.isArray(items) && items.length > 0 ? items : SEED_DATA
    return res.json({ vehicles: results, count: results.length, limit: Number(limit), offset: Number(offset) })
  } catch (error: any) {
    return res.json({ vehicles: SEED_DATA, count: SEED_DATA.length, limit: 20, offset: 0 })
  }
}
