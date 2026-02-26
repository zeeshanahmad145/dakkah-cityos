import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { handleApiError } from "../../../../lib/api-error-handler"

const catalog: Record<string, any> = {
  wl_skincare_01: {
    id: "wl_skincare_01",
    title: "Private Label Skincare Line",
    description: "Launch your own branded skincare line with our white-label manufacturing. Includes moisturizer, cleanser, and serum. Our products are dermatologist-tested and cruelty-free.",
    category: "Beauty & Skincare",
    base_price: 14999,
    currency_code: "usd",
    thumbnail: "/seed-images/bundles%2F1556228578-0d85b1a4d571.jpg",
    status: "available",
    min_order_quantity: 100,
    lead_time: "4-6 weeks",
    customization: ["Logo", "Packaging Design", "Fragrance", "Ingredients"],
    includes: ["Moisturizer (50ml)", "Cleanser (100ml)", "Serum (30ml)"],
    certifications: ["Cruelty-Free", "Dermatologist Tested", "Paraben-Free"],
  },
  wl_supplement_01: {
    id: "wl_supplement_01",
    title: "Custom Supplement Brand",
    description: "Create your own supplement brand with our white-label solutions. FDA-compliant manufacturing with GMP certification.",
    category: "Health & Supplements",
    base_price: 9999,
    currency_code: "usd",
    thumbnail: "/seed-images/white-label%2F1551836022-4c4c79ecde51.jpg",
    status: "available",
    min_order_quantity: 250,
    lead_time: "6-8 weeks",
    customization: ["Formula", "Packaging", "Label Design", "Capsule Color"],
    includes: ["Custom Formula Development", "Label Design", "Regulatory Compliance"],
    certifications: ["FDA Compliant", "GMP Certified", "Third-Party Tested"],
  },
  wl_coffee_01: {
    id: "wl_coffee_01",
    title: "White Label Coffee Brand",
    description: "Start your own coffee brand with premium roasted beans and custom packaging. Sourced from top coffee-growing regions worldwide.",
    category: "Food & Beverage",
    base_price: 7999,
    currency_code: "usd",
    thumbnail: "/seed-images/bundles%2F1504674900247-0877df9cc836.jpg",
    status: "available",
    min_order_quantity: 50,
    lead_time: "2-3 weeks",
    customization: ["Roast Level", "Blend", "Packaging", "Label"],
    includes: ["Custom Blend Development", "Packaging Design", "Quality Testing"],
    certifications: ["Fair Trade Available", "Organic Options", "USDA Certified"],
  },
  wl_clothing_01: {
    id: "wl_clothing_01",
    title: "Private Label Clothing Line",
    description: "Design and launch your own clothing brand with our white-label apparel manufacturing. Full range from basics to premium garments.",
    category: "Fashion",
    base_price: 19999,
    currency_code: "usd",
    thumbnail: "/seed-images/affiliate%2F1483985988355-763728e1935b.jpg",
    status: "available",
    min_order_quantity: 200,
    lead_time: "8-12 weeks",
    customization: ["Design", "Fabric", "Labels", "Packaging", "Sizing"],
    includes: ["Pattern Development", "Sample Production", "Size Grading", "Quality Control"],
    certifications: ["OEKO-TEX", "GOTS Organic Options"],
  },
  wl_candle_01: {
    id: "wl_candle_01",
    title: "Custom Candle Brand",
    description: "Launch a luxury candle brand with your custom scents and packaging. Hand-poured using premium soy wax.",
    category: "Home & Living",
    base_price: 5999,
    currency_code: "usd",
    thumbnail: "/seed-images/social-commerce%2F1547887538-e3a2f32cb1cc.jpg",
    status: "available",
    min_order_quantity: 100,
    lead_time: "3-4 weeks",
    customization: ["Scent", "Wax Type", "Container", "Label Design"],
    includes: ["Scent Development", "Container Selection", "Label Design", "Gift Boxing Options"],
    certifications: ["Eco-Friendly", "Clean Burning", "Phthalate-Free"],
  },
}

const defaultItem = catalog.wl_skincare_01

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const { id } = req.params
    const item = catalog[id]
    if (!item) {
      return res.json({ item: defaultItem })
    }
    return res.json({ item })
  } catch (error: any) {
    return res.json({ item: defaultItem })
  }
}
