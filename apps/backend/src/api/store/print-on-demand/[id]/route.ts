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
    thumbnail: "/seed-images/auctions/1523275335684-37898b6baf30.jpg",
    image: "/seed-images/auctions/1523275335684-37898b6baf30.jpg",
    status: "available",
    options: ["S", "M", "L", "XL", "2XL"],
    print_areas: ["front", "back"],
    production_time: "3-5 business days",
    materials: "100% ring-spun cotton",
    care_instructions: "Machine wash cold, tumble dry low",
    reviews: [
      { author: "Omar K.", rating: 5, comment: "Print quality is outstanding. Colors are vibrant and haven't faded after multiple washes.", created_at: "2025-01-05T10:00:00Z" },
      { author: "Layla M.", rating: 4, comment: "Soft cotton and great fit. The custom design came out exactly as I uploaded it.", created_at: "2025-01-15T13:00:00Z" },
      { author: "Reem H.", rating: 5, comment: "Ordered 50 for our team event. Every single one was perfect. Fast turnaround!", created_at: "2025-01-25T09:00:00Z" },
      { author: "Khalid S.", rating: 4, comment: "Good quality for the price. Only wish there were more color options for the shirt itself.", created_at: "2025-02-05T14:00:00Z" },
      { author: "Nadia F.", rating: 5, comment: "Best print-on-demand t-shirts I've ordered. Will definitely be a repeat customer.", created_at: "2025-02-15T11:00:00Z" },
    ],
  },
  pod_mug_01: {
    id: "pod_mug_01",
    title: "Custom Mug",
    description: "Personalized ceramic mug with your design, perfect for gifts and branding. Dishwasher and microwave safe.",
    category: "Drinkware",
    base_price: 1299,
    currency_code: "usd",
    thumbnail: "/seed-images/auctions/1526170375885-4d8ecf77b99f.jpg",
    image: "/seed-images/auctions/1526170375885-4d8ecf77b99f.jpg",
    status: "available",
    options: ["11oz", "15oz"],
    print_areas: ["wrap"],
    production_time: "2-4 business days",
    materials: "Ceramic",
    care_instructions: "Dishwasher safe",
    reviews: [
      { author: "Sara D.", rating: 5, comment: "Perfect corporate gifts! Our logo came out crisp and the mugs are sturdy.", created_at: "2025-01-08T09:00:00Z" },
      { author: "Ahmed W.", rating: 4, comment: "Great quality ceramic. The wrap printing covers the entire mug beautifully.", created_at: "2025-01-18T12:00:00Z" },
      { author: "Fatima B.", rating: 5, comment: "Made personalized mugs for my wedding favors. Guests loved them!", created_at: "2025-01-28T15:00:00Z" },
      { author: "Mansour T.", rating: 4, comment: "Dishwasher safe as promised. Design hasn't faded after months of daily use.", created_at: "2025-02-07T10:00:00Z" },
      { author: "Huda R.", rating: 5, comment: "Quick production and the 15oz size is perfect for my morning coffee.", created_at: "2025-02-17T08:00:00Z" },
    ],
  },
  pod_poster_01: {
    id: "pod_poster_01",
    title: "Custom Poster",
    description: "High-quality poster printing on premium paper stock. Vivid colors and sharp details.",
    category: "Wall Art",
    base_price: 2499,
    currency_code: "usd",
    thumbnail: "/seed-images/freelance/1461749280684-dccba630e2f6.jpg",
    image: "/seed-images/freelance/1461749280684-dccba630e2f6.jpg",
    status: "available",
    options: ["12x18", "18x24", "24x36"],
    print_areas: ["front"],
    production_time: "2-3 business days",
    materials: "Premium matte paper, 200gsm",
    care_instructions: "Frame recommended",
    reviews: [
      { author: "Waleed G.", rating: 5, comment: "Gallery-quality print. The 200gsm paper feels premium and colors are vivid.", created_at: "2025-01-06T10:00:00Z" },
      { author: "Dina L.", rating: 4, comment: "Great for decorating my office. The 24x36 size is impressive.", created_at: "2025-01-16T14:00:00Z" },
      { author: "Badr E.", rating: 5, comment: "Printed artwork for my gallery show. The detail reproduction is incredible.", created_at: "2025-01-26T11:00:00Z" },
      { author: "Noura K.", rating: 5, comment: "Fast turnaround and the matte finish looks professional. Highly recommend.", created_at: "2025-02-06T09:00:00Z" },
      { author: "Tariq P.", rating: 4, comment: "Good value for custom art prints. Edges are clean and colors are accurate.", created_at: "2025-02-16T13:00:00Z" },
    ],
  },
  pod_hoodie_01: {
    id: "pod_hoodie_01",
    title: "Custom Hoodie",
    description: "Premium custom hoodie with your artwork or logo. Soft fleece interior for warmth and comfort.",
    category: "Apparel",
    base_price: 3999,
    currency_code: "usd",
    thumbnail: "/seed-images/affiliate/1483985988355-763728e1935b.jpg",
    image: "/seed-images/affiliate/1483985988355-763728e1935b.jpg",
    status: "available",
    options: ["S", "M", "L", "XL", "2XL"],
    print_areas: ["front", "back"],
    production_time: "5-7 business days",
    materials: "80% cotton, 20% polyester fleece",
    care_instructions: "Machine wash cold, hang dry",
    reviews: [
      { author: "Amira N.", rating: 5, comment: "Incredibly soft fleece and the print quality on both sides is flawless.", created_at: "2025-01-04T10:00:00Z" },
      { author: "Yousef Q.", rating: 4, comment: "Perfect for our company merch. Employees love the comfort and design.", created_at: "2025-01-14T12:00:00Z" },
      { author: "Salwa V.", rating: 5, comment: "Warm, comfortable, and the custom artwork looks amazing. My new favorite hoodie.", created_at: "2025-01-24T15:00:00Z" },
      { author: "Karim J.", rating: 4, comment: "Great quality but production took the full 7 days. Plan ahead for bulk orders.", created_at: "2025-02-03T09:00:00Z" },
      { author: "Ghada M.", rating: 5, comment: "Ordered matching hoodies for my family. Everyone is thrilled with theirs!", created_at: "2025-02-13T11:00:00Z" },
    ],
  },
  pod_phonecase_01: {
    id: "pod_phonecase_01",
    title: "Custom Phone Case",
    description: "Durable custom phone case with your unique design. Impact-resistant with raised edges for screen protection.",
    category: "Accessories",
    base_price: 1599,
    currency_code: "usd",
    thumbnail: "/seed-images/bundles/1519389950473-47ba0277781c.jpg",
    image: "/seed-images/bundles/1519389950473-47ba0277781c.jpg",
    status: "available",
    options: ["iPhone 14", "iPhone 15", "Samsung S24"],
    print_areas: ["back"],
    production_time: "3-5 business days",
    materials: "Polycarbonate shell with TPU bumper",
    care_instructions: "Wipe clean with damp cloth",
    reviews: [
      { author: "Faris A.", rating: 5, comment: "Sturdy case with excellent print quality. My custom photo looks amazing on it.", created_at: "2025-01-07T09:00:00Z" },
      { author: "Mona H.", rating: 4, comment: "Good protection with raised edges. The design hasn't scratched off at all.", created_at: "2025-01-17T11:00:00Z" },
      { author: "Jaber S.", rating: 5, comment: "Ordered for iPhone 15 and the fit is perfect. Great custom gift idea.", created_at: "2025-01-27T14:00:00Z" },
      { author: "Rana T.", rating: 4, comment: "Nice quality but wish Samsung had more model options available.", created_at: "2025-02-08T10:00:00Z" },
      { author: "Hassan D.", rating: 5, comment: "Impact-resistant as advertised. Dropped my phone twice and case held up perfectly.", created_at: "2025-02-18T16:00:00Z" },
    ],
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
  } catch (error: unknown) {
    return res.json({ item: defaultItem })
  }
}
