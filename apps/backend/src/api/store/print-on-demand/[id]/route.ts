import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { handleApiError } from "../../../../lib/api-error-handler"

const catalog: Record<string, any> = {
  pod_tshirt_01: {
    id: "pod_tshirt_01",
    title: "Custom T-Shirt",
    description: "Design your own custom t-shirt with high-quality print-on-demand production. Made from 100% ring-spun cotton for ultimate comfort.",
    category: "Apparel",
    base_price: 1999,
    currency_code: "usd",
    thumbnail: "/seed-images/auctions%2F1523275335684-37898b6baf30.jpg",
    image: "/seed-images/auctions%2F1523275335684-37898b6baf30.jpg",
    status: "available",
    options: ["S", "M", "L", "XL", "2XL"],
    print_areas: ["front", "back"],
    production_time: "3-5 business days",
    materials: "100% ring-spun cotton",
    care_instructions: "Machine wash cold, tumble dry low",
  },
  pod_mug_01: {
    id: "pod_mug_01",
    title: "Custom Mug",
    description: "Personalized ceramic mug with your design, perfect for gifts and branding. Dishwasher and microwave safe.",
    category: "Drinkware",
    base_price: 1299,
    currency_code: "usd",
    thumbnail: "/seed-images/auctions%2F1526170375885-4d8ecf77b99f.jpg",
    image: "/seed-images/auctions%2F1526170375885-4d8ecf77b99f.jpg",
    status: "available",
    options: ["11oz", "15oz"],
    print_areas: ["wrap"],
    production_time: "2-4 business days",
    materials: "Ceramic",
    care_instructions: "Dishwasher safe",
  },
  pod_poster_01: {
    id: "pod_poster_01",
    title: "Custom Poster",
    description: "High-quality poster printing on premium paper stock. Vivid colors and sharp details.",
    category: "Wall Art",
    base_price: 2499,
    currency_code: "usd",
    thumbnail: "/seed-images/freelance%2F1461749280684-dccba630e2f6.jpg",
    image: "/seed-images/freelance%2F1461749280684-dccba630e2f6.jpg",
    status: "available",
    options: ["12x18", "18x24", "24x36"],
    print_areas: ["front"],
    production_time: "2-3 business days",
    materials: "Premium matte paper, 200gsm",
    care_instructions: "Frame recommended",
  },
  pod_hoodie_01: {
    id: "pod_hoodie_01",
    title: "Custom Hoodie",
    description: "Premium custom hoodie with your artwork or logo. Soft fleece interior for warmth and comfort.",
    category: "Apparel",
    base_price: 3999,
    currency_code: "usd",
    thumbnail: "/seed-images/affiliate%2F1483985988355-763728e1935b.jpg",
    image: "/seed-images/affiliate%2F1483985988355-763728e1935b.jpg",
    status: "available",
    options: ["S", "M", "L", "XL", "2XL"],
    print_areas: ["front", "back"],
    production_time: "5-7 business days",
    materials: "80% cotton, 20% polyester fleece",
    care_instructions: "Machine wash cold, hang dry",
  },
  pod_phonecase_01: {
    id: "pod_phonecase_01",
    title: "Custom Phone Case",
    description: "Durable custom phone case with your unique design. Impact-resistant with raised edges for screen protection.",
    category: "Accessories",
    base_price: 1599,
    currency_code: "usd",
    thumbnail: "/seed-images/bundles%2F1519389950473-47ba0277781c.jpg",
    image: "/seed-images/bundles%2F1519389950473-47ba0277781c.jpg",
    status: "available",
    options: ["iPhone 14", "iPhone 15", "Samsung S24"],
    print_areas: ["back"],
    production_time: "3-5 business days",
    materials: "Polycarbonate shell with TPU bumper",
    care_instructions: "Wipe clean with damp cloth",
  },
}

const defaultItem = catalog.pod_tshirt_01

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
