import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { handleApiError } from "../../../../lib/api-error-handler"

const SEED_DATA = [
  {
    id: "util-seed-1",
    name: "City Electric Power",
    description: "Reliable residential and commercial electricity service with 24/7 support and smart meter monitoring.",
    utility_type: "electricity",
    provider: "City Power Corp",
    status: "active",
    base_rate: 1200,
    rate_unit: "kWh",
    currency: "USD",
    billing_cycle: "monthly",
    features: ["Smart meter monitoring", "24/7 outage reporting", "Green energy options", "Budget billing available"],
    service_area: "Metro Area",
    thumbnail: "/seed-images/government%2F1450101499163-c8848c66ca85.jpg",
  },
  {
    id: "util-seed-2",
    name: "Pure Water Supply",
    description: "Clean municipal water service with quality monitoring and flexible payment plans.",
    utility_type: "water",
    provider: "Municipal Water Authority",
    status: "active",
    base_rate: 450,
    rate_unit: "gallon",
    currency: "USD",
    billing_cycle: "monthly",
    features: ["Water quality reports", "Leak detection alerts", "Conservation programs", "Online bill pay"],
    service_area: "City Limits",
    thumbnail: "/seed-images/grocery%2F1542838132-92c53300e7e2.jpg",
  },
  {
    id: "util-seed-3",
    name: "FiberNet Internet",
    description: "High-speed fiber optic internet service with symmetrical upload and download speeds.",
    utility_type: "internet",
    provider: "FiberNet Communications",
    status: "active",
    base_rate: 6999,
    rate_unit: "month",
    currency: "USD",
    billing_cycle: "monthly",
    features: ["1Gbps speeds", "No data caps", "Free installation", "Wi-Fi 6 router included"],
    service_area: "Metro & Suburban",
    thumbnail: "/seed-images/digital-products%2F1550751827-4bd374c3f58b.jpg",
  },
  {
    id: "util-seed-4",
    name: "Natural Gas Service",
    description: "Dependable natural gas delivery for heating, cooking, and industrial applications.",
    utility_type: "gas",
    provider: "Regional Gas Company",
    status: "active",
    base_rate: 850,
    rate_unit: "therm",
    currency: "USD",
    billing_cycle: "monthly",
    features: ["Safety inspections", "Budget billing", "Energy efficiency rebates", "Emergency service line"],
    service_area: "Regional",
    thumbnail: "/seed-images/automotive%2F1549317661-bd12fba613b8.jpg",
  },
  {
    id: "util-seed-5",
    name: "TeleCom Phone Service",
    description: "Comprehensive phone service with unlimited local and long-distance calling.",
    utility_type: "phone",
    provider: "TeleCom Networks",
    status: "active",
    base_rate: 3999,
    rate_unit: "month",
    currency: "USD",
    billing_cycle: "monthly",
    features: ["Unlimited calling", "Voicemail to email", "Call forwarding", "International rates from $0.02/min"],
    service_area: "Nationwide",
    thumbnail: "/seed-images/freelance%2F1532094349884-543bc11b234d.jpg",
  },
]

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const mod = req.scope.resolve("utilities") as any
    const { id } = req.params
    const [item] = await mod.listUtilityAccounts({ id }, { take: 1 })
    if (!item) {
      const seed = SEED_DATA.find((s) => s.id === id) || SEED_DATA[0]
      return res.json({ item: { ...seed, id } })
    }
    return res.json({ item })
  } catch (error: any) {
    const { id } = req.params
    const seed = SEED_DATA.find((s) => s.id === id) || SEED_DATA[0]
    return res.json({ item: { ...seed, id } })
  }
}
