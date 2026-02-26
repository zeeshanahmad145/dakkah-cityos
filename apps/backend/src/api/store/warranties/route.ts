import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { handleApiError } from "../../../lib/api-error-handler"

const SEED_DATA = [
  {
    id: "warranty-seed-1",
    name: "Essential Protection Plan",
    description: "Basic warranty coverage for manufacturing defects and hardware failures. Ideal for everyday electronics.",
    plan_type: "basic",
    duration_months: 12,
    currency_code: "USD",
    coverage: ["Manufacturing defects", "Hardware failures", "Battery replacement"],
    exclusions: ["Accidental damage", "Water damage", "Cosmetic wear"],
    is_active: true,
    price: 2999,
    rating: 4.2,
    metadata: { thumbnail: "/seed-images/content%2F1454165804606-c3d57bc86b40.jpg" },
  },
  {
    id: "warranty-seed-2",
    name: "Standard Care Plan",
    description: "Extended warranty with accidental damage protection. Covers drops, spills, and mechanical failures.",
    plan_type: "standard",
    duration_months: 24,
    currency_code: "USD",
    coverage: ["Manufacturing defects", "Accidental damage", "Power surge protection", "Battery replacement", "Screen repair"],
    exclusions: ["Intentional damage", "Loss or theft", "Cosmetic wear"],
    is_active: true,
    price: 5999,
    rating: 4.5,
    metadata: { thumbnail: "/seed-images/government%2F1450101499163-c8848c66ca85.jpg" },
  },
  {
    id: "warranty-seed-3",
    name: "Premium Shield Plan",
    description: "Comprehensive coverage including accidental damage, water damage, and theft protection with same-day replacement.",
    plan_type: "premium",
    duration_months: 36,
    currency_code: "USD",
    coverage: ["Manufacturing defects", "Accidental damage", "Water damage", "Theft protection", "Same-day replacement", "Free diagnostics"],
    exclusions: ["Intentional damage", "Unauthorized modifications"],
    is_active: true,
    price: 9999,
    rating: 4.8,
    metadata: { thumbnail: "/seed-images/warranties%2F1589829545856-d10d557cf95f.jpg" },
  },
  {
    id: "warranty-seed-4",
    name: "Extended MaxCare",
    description: "Our longest warranty plan with 4 years of full coverage. Includes annual maintenance and priority repair service.",
    plan_type: "extended",
    duration_months: 48,
    currency_code: "USD",
    coverage: ["All defects and failures", "Accidental damage", "Water damage", "Annual maintenance", "Priority repair", "Loaner device"],
    exclusions: ["Intentional damage"],
    is_active: true,
    price: 14999,
    rating: 4.9,
    metadata: { thumbnail: "/seed-images/warranties%2F1506784983877-45594efa4cbe.jpg" },
  },
  {
    id: "warranty-seed-5",
    name: "Home Appliance Guard",
    description: "Specialized warranty for home appliances. Covers refrigerators, washers, dryers, and kitchen appliances.",
    plan_type: "standard",
    duration_months: 24,
    currency_code: "USD",
    coverage: ["Mechanical failures", "Electrical component failures", "Compressor coverage", "Motor protection", "In-home service"],
    exclusions: ["Cosmetic damage", "Filter replacements", "Normal wear"],
    is_active: true,
    price: 7999,
    rating: 4.4,
    metadata: { thumbnail: "/seed-images/classifieds%2F1555041469-a586c61ea9bc.jpg" },
  },
]

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const mod = req.scope.resolve("warranty") as any
    const {
      limit = "20",
      offset = "0",
      tenant_id,
      coverage_type,
      is_active,
      duration,
      search,
      product_id,
    } = req.query as Record<string, string | undefined>

    const filters: Record<string, any> = {}
    if (tenant_id) filters.tenant_id = tenant_id
    if (coverage_type) filters.coverage_type = coverage_type
    if (is_active) filters.is_active = is_active === "true"
    if (duration) filters.duration = Number(duration)
    if (product_id) filters.product_id = product_id
    if (search) filters.search = search

    const items = await mod.listWarrantyPlans(filters, { skip: Number(offset), take: Number(limit) })
    const results = Array.isArray(items) && items.length > 0 ? items : SEED_DATA
    return res.json({
      items: results,
      count: results.length,
      limit: Number(limit),
      offset: Number(offset),
    })
  } catch (error: any) {
    handleApiError(res, error, "STORE-WARRANTIES")}
}

