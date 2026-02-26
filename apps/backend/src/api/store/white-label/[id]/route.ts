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
    thumbnail: "/seed-images/bundles/1556228578-0d85b1a4d571.jpg",
    status: "available",
    min_order_quantity: 100,
    lead_time: "4-6 weeks",
    customization: ["Logo", "Packaging Design", "Fragrance", "Ingredients"],
    includes: ["Moisturizer (50ml)", "Cleanser (100ml)", "Serum (30ml)"],
    certifications: ["Cruelty-Free", "Dermatologist Tested", "Paraben-Free"],
    reviews: [{ author: "Beauty Brand Owner", rating: 5, comment: "Launched our skincare line in 6 weeks. Exceptional quality.", created_at: "2024-06-15T00:00:00Z" }, { author: "Spa Owner", rating: 4, comment: "Dermatologist-tested products give our customers confidence.", created_at: "2024-06-10T00:00:00Z" }, { author: "Influencer", rating: 5, comment: "My followers love the custom skincare line.", created_at: "2024-05-28T00:00:00Z" }, { author: "Entrepreneur", rating: 4, comment: "Great fragrance customization options.", created_at: "2024-05-20T00:00:00Z" }, { author: "Retailer", rating: 5, comment: "Cruelty-free certification is a huge selling point.", created_at: "2024-05-15T00:00:00Z" }],
  },
  wl_supplement_01: {
    id: "wl_supplement_01",
    title: "Custom Supplement Brand",
    description: "Create your own supplement brand with our white-label solutions. FDA-compliant manufacturing with GMP certification.",
    category: "Health & Supplements",
    base_price: 9999,
    currency_code: "usd",
    thumbnail: "/seed-images/white-label/1551836022-4c4c79ecde51.jpg",
    status: "available",
    min_order_quantity: 250,
    lead_time: "6-8 weeks",
    customization: ["Formula", "Packaging", "Label Design", "Capsule Color"],
    includes: ["Custom Formula Development", "Label Design", "Regulatory Compliance"],
    certifications: ["FDA Compliant", "GMP Certified", "Third-Party Tested"],
    reviews: [{ author: "Health Brand CEO", rating: 5, comment: "FDA-compliant manufacturing gave us peace of mind.", created_at: "2024-07-12T00:00:00Z" }, { author: "Fitness Coach", rating: 4, comment: "Custom formula development was excellent.", created_at: "2024-07-05T00:00:00Z" }, { author: "Nutritionist", rating: 5, comment: "Third-party testing ensures quality.", created_at: "2024-06-28T00:00:00Z" }, { author: "Gym Owner", rating: 4, comment: "GMP certification is essential for our brand.", created_at: "2024-06-20T00:00:00Z" }, { author: "DTC Brand", rating: 5, comment: "Great capsule color and packaging options.", created_at: "2024-06-15T00:00:00Z" }],
  },
  wl_coffee_01: {
    id: "wl_coffee_01",
    title: "White Label Coffee Brand",
    description: "Start your own coffee brand with premium roasted beans and custom packaging. Sourced from top coffee-growing regions worldwide.",
    category: "Food & Beverage",
    base_price: 7999,
    currency_code: "usd",
    thumbnail: "/seed-images/bundles/1504674900247-0877df9cc836.jpg",
    status: "available",
    min_order_quantity: 50,
    lead_time: "2-3 weeks",
    customization: ["Roast Level", "Blend", "Packaging", "Label"],
    includes: ["Custom Blend Development", "Packaging Design", "Quality Testing"],
    certifications: ["Fair Trade Available", "Organic Options", "USDA Certified"],
    reviews: [{ author: "Coffee Entrepreneur", rating: 5, comment: "Premium beans and the blend is exactly what we wanted.", created_at: "2024-08-10T00:00:00Z" }, { author: "Cafe Owner", rating: 5, comment: "Fast 2-week turnaround and amazing quality.", created_at: "2024-08-05T00:00:00Z" }, { author: "Subscription Box", rating: 4, comment: "Fair trade options are great for our brand.", created_at: "2024-07-28T00:00:00Z" }, { author: "Roaster", rating: 4, comment: "Custom blend development was professional.", created_at: "2024-07-20T00:00:00Z" }, { author: "Food Blogger", rating: 5, comment: "USDA certified organic option is a game changer.", created_at: "2024-07-15T00:00:00Z" }],
  },
  wl_clothing_01: {
    id: "wl_clothing_01",
    title: "Private Label Clothing Line",
    description: "Design and launch your own clothing brand with our white-label apparel manufacturing. Full range from basics to premium garments.",
    category: "Fashion",
    base_price: 19999,
    currency_code: "usd",
    thumbnail: "/seed-images/affiliate/1483985988355-763728e1935b.jpg",
    status: "available",
    min_order_quantity: 200,
    lead_time: "8-12 weeks",
    customization: ["Design", "Fabric", "Labels", "Packaging", "Sizing"],
    includes: ["Pattern Development", "Sample Production", "Size Grading", "Quality Control"],
    certifications: ["OEKO-TEX", "GOTS Organic Options"],
    reviews: [{ author: "Fashion Designer", rating: 5, comment: "Pattern development and size grading were top notch.", created_at: "2024-05-15T00:00:00Z" }, { author: "Boutique Owner", rating: 4, comment: "OEKO-TEX certified fabrics are exactly what we need.", created_at: "2024-05-10T00:00:00Z" }, { author: "Brand Founder", rating: 5, comment: "Quality control exceeded our expectations.", created_at: "2024-04-28T00:00:00Z" }, { author: "Streetwear Brand", rating: 4, comment: "Great fabric selection and sample production.", created_at: "2024-04-20T00:00:00Z" }, { author: "Retailer", rating: 5, comment: "From design to delivery, everything was smooth.", created_at: "2024-04-15T00:00:00Z" }],
  },
  wl_candle_01: {
    id: "wl_candle_01",
    title: "Custom Candle Brand",
    description: "Launch a luxury candle brand with your custom scents and packaging. Hand-poured using premium soy wax.",
    category: "Home & Living",
    base_price: 5999,
    currency_code: "usd",
    thumbnail: "/seed-images/social-commerce/1547887538-e3a2f32cb1cc.jpg",
    status: "available",
    min_order_quantity: 100,
    lead_time: "3-4 weeks",
    customization: ["Scent", "Wax Type", "Container", "Label Design"],
    includes: ["Scent Development", "Container Selection", "Label Design", "Gift Boxing Options"],
    certifications: ["Eco-Friendly", "Clean Burning", "Phthalate-Free"],
    reviews: [{ author: "Home Decor Brand", rating: 5, comment: "Premium soy wax candles with beautiful custom scents.", created_at: "2024-09-10T00:00:00Z" }, { author: "Gift Shop Owner", rating: 4, comment: "Fast turnaround and gorgeous packaging options.", created_at: "2024-09-05T00:00:00Z" }, { author: "Lifestyle Blogger", rating: 5, comment: "Phthalate-free and clean burning. My customers love them.", created_at: "2024-08-28T00:00:00Z" }, { author: "Wedding Planner", rating: 5, comment: "Perfect for custom wedding favors.", created_at: "2024-08-20T00:00:00Z" }, { author: "Spa Owner", rating: 4, comment: "Eco-friendly certification helps our brand image.", created_at: "2024-08-15T00:00:00Z" }],
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
