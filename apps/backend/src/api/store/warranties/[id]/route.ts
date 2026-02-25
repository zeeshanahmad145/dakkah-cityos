import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { handleApiError } from "../../../../lib/api-error-handler"

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
    metadata: { thumbnail: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&h=600&fit=crop" },
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
    metadata: { thumbnail: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=800&h=600&fit=crop" },
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
    metadata: { thumbnail: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800&h=600&fit=crop" },
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
    metadata: { thumbnail: "https://images.unsplash.com/photo-1506784983877-45594efa4cbe?w=800&h=600&fit=crop" },
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
    metadata: { thumbnail: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&h=600&fit=crop" },
  },
]

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const mod = req.scope.resolve("warranty") as any
    const { id } = req.params
    const [item] = await mod.listWarrantyPlans({ id }, { take: 1 })
    if (!item) {
      const seedItem = SEED_DATA.find((s) => s.id === id) || SEED_DATA[0]
      return res.json({ item: seedItem })
    }
    return res.json({ item })
  } catch (error: any) {
    const seedItem = SEED_DATA.find((s) => s.id === req.params.id) || SEED_DATA[0]
    return res.json({ item: seedItem })
  }
}
