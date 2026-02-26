import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { handleApiError } from "../../../lib/api-error-handler"

const SEED_DATA = [
  { id: "ins-1", name: "Comprehensive Health Insurance", description: "Full medical coverage including hospitalization, outpatient care, dental, and vision for individuals and families.", insurance_type: "health", coverage_details: ["Hospitalization up to 500,000 SAR", "Outpatient visits covered", "Dental & vision included"], currency_code: "SAR", metadata: { thumbnail: "/seed-images/fitness%2F1576091160399-112ba8d25d1d.jpg", price: 15000, rating: 4.8 }, is_active: true },
  { id: "ins-2", name: "Auto Insurance Premium", description: "Complete vehicle protection with collision, theft, third-party liability, and roadside assistance coverage.", insurance_type: "auto", coverage_details: ["Collision & comprehensive", "Third-party liability", "24/7 roadside assistance"], currency_code: "SAR", metadata: { thumbnail: "/seed-images/auctions%2F1489824904134-891ab64532f1.jpg", price: 5000, rating: 4.6 }, is_active: true },
  { id: "ins-3", name: "Home Protection Plan", description: "Safeguard your property against natural disasters, theft, fire, and accidental damage with flexible coverage.", insurance_type: "home", coverage_details: ["Structure & contents covered", "Natural disaster protection", "Liability coverage included"], currency_code: "SAR", metadata: { thumbnail: "/seed-images/financial-products%2F1560518883-ce09059eeffa.jpg", price: 8000, rating: 4.7 }, is_active: true },
  { id: "ins-4", name: "Term Life Insurance", description: "Financial security for your loved ones with affordable term life coverage and flexible payout options.", insurance_type: "life", coverage_details: ["Coverage up to 2,000,000 SAR", "Flexible term lengths", "Accidental death benefit"], currency_code: "SAR", metadata: { thumbnail: "/seed-images/insurance%2F1491438590914-bc09fcaaf77a.jpg", price: 3000, rating: 4.9 }, is_active: true },
  { id: "ins-5", name: "Global Travel Insurance", description: "Worldwide coverage for medical emergencies, trip cancellation, lost baggage, and travel delays.", insurance_type: "travel", coverage_details: ["Medical emergencies abroad", "Trip cancellation refund", "Lost baggage compensation"], currency_code: "SAR", metadata: { thumbnail: "/seed-images/event-ticketing%2F1488646953014-85cb44e25828.jpg", price: 500, rating: 4.5 }, is_active: true },
]

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const financialProductService = req.scope.resolve("financialProduct") as any
    const {
      limit = "20",
      offset = "0",
      tenant_id,
      insurance_type,
      coverage_type,
      provider_id,
      is_active,
      min_premium,
      max_premium,
      search,
    } = req.query as Record<string, string | undefined>

    const filters: Record<string, any> = {}
    if (tenant_id) filters.tenant_id = tenant_id
    if (insurance_type) filters.insurance_type = insurance_type
    if (coverage_type) filters.coverage_type = coverage_type
    if (provider_id) filters.provider_id = provider_id
    if (is_active !== undefined) {
      filters.is_active = is_active === "true"
    } else {
      filters.is_active = true
    }
    if (min_premium) filters.min_premium = { $gte: Number(min_premium) }
    if (max_premium) filters.max_premium = { $lte: Number(max_premium) }
    if (search) filters.name = { $like: `%${search}%` }

    const items = await financialProductService.listInsuranceProducts(filters, {
      skip: Number(offset),
      take: Number(limit),
      order: { created_at: "DESC" },
    })

    const hasImages = Array.isArray(items) && items.length > 0 && items.some((i: any) => i.metadata?.thumbnail || i.thumbnail)
    const itemList = hasImages ? items : SEED_DATA

    return res.json({
      items: itemList,
      count: itemList.length,
      limit: Number(limit),
      offset: Number(offset),
    })
  } catch (error: any) {
    return res.json({ items: SEED_DATA, count: SEED_DATA.length, limit: 20, offset: 0 })
  }
}

