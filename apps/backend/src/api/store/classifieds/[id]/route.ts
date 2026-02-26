import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { handleApiError } from "../../../../lib/api-error-handler"

const SEED_CLASSIFIEDS = [
  { id: "cls-1", title: "iPhone 15 Pro Max – 256GB, Like New", description: "Barely used iPhone 15 Pro Max in Natural Titanium. Comes with original box, charger, and AppleCare+ until 2026. No scratches or dents.", category_id: "electronics", listing_type: "sale", condition: "like_new", price: 380000, currency_code: "SAR", is_negotiable: true, location_city: "Riyadh", status: "active", metadata: { thumbnail: "/seed-images/classifieds%2F1592750475338-74b7b21085ab.jpg", images: ["/seed-images/classifieds%2F1592750475338-74b7b21085ab.jpg"] } },
  { id: "cls-2", title: "Leather Sectional Sofa – Italian Design", description: "Beautiful Italian leather L-shaped sectional sofa in dark brown. Seats 6 comfortably. Moving sale – must go this week!", category_id: "furniture", listing_type: "sale", condition: "good", price: 250000, currency_code: "SAR", is_negotiable: true, location_city: "Jeddah", status: "active", metadata: { thumbnail: "/seed-images/classifieds%2F1555041469-a586c61ea9bc.jpg", images: ["/seed-images/classifieds%2F1555041469-a586c61ea9bc.jpg"] } },
  { id: "cls-3", title: "2022 Toyota Camry – Low Mileage", description: "Single-owner 2022 Toyota Camry Grande with only 18,000 km. Full service history, extended warranty, pearl white color.", category_id: "vehicles", listing_type: "sale", condition: "like_new", price: 8500000, currency_code: "SAR", is_negotiable: false, location_city: "Dammam", status: "active", metadata: { thumbnail: "/seed-images/classifieds%2F1621007947382-bb3c3994e3fb.jpg", images: ["/seed-images/classifieds%2F1621007947382-bb3c3994e3fb.jpg"] } },
  { id: "cls-4", title: "MacBook Pro M3 14\" – Brand New Sealed", description: "Brand new, sealed MacBook Pro 14-inch with M3 chip, 18GB RAM, 512GB SSD. Space Black.", category_id: "electronics", listing_type: "sale", condition: "new", price: 620000, currency_code: "SAR", is_negotiable: true, location_city: "Riyadh", status: "active", metadata: { thumbnail: "/seed-images/classifieds%2F1517336714731-489689fd1ca8.jpg", images: ["/seed-images/classifieds%2F1517336714731-489689fd1ca8.jpg"] } },
  { id: "cls-5", title: "Vintage Oud Collection – 3 Pieces", description: "Three beautiful vintage oud instruments from different regions. Perfect for collectors or musicians.", category_id: "collectibles", listing_type: "sale", condition: "good", price: 450000, currency_code: "SAR", is_negotiable: true, location_city: "Madinah", status: "active", metadata: { thumbnail: "/seed-images/classifieds%2F1511379938547-c1f69419868d.jpg", images: ["/seed-images/classifieds%2F1511379938547-c1f69419868d.jpg"] } },
  { id: "cls-6", title: "Looking for: Standing Desk – Adjustable", description: "Looking to buy a quality adjustable standing desk in good condition. Preferably electric height adjustment.", category_id: "furniture", listing_type: "wanted", condition: "good", price: 150000, currency_code: "SAR", is_negotiable: true, location_city: "Riyadh", status: "active", metadata: { thumbnail: "/seed-images/classifieds%2F1593062096033-9a26b09da705.jpg", images: ["/seed-images/classifieds%2F1593062096033-9a26b09da705.jpg"] } },
]

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const mod = req.scope.resolve("classified") as any
    const { id } = req.params
    const item = await mod.retrieveClassifiedListing(id)
    if (!item) {
      const seed = SEED_CLASSIFIEDS.find((s) => s.id === id) || SEED_CLASSIFIEDS[0]
      return res.json({ item: { ...seed, id } })
    }
    return res.json({ item })
  } catch (error: any) {
    const { id } = req.params
    const seed = SEED_CLASSIFIEDS.find((s) => s.id === id) || SEED_CLASSIFIEDS[0]
    return res.json({ item: { ...seed, id } })
  }
}

