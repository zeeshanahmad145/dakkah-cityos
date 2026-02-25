import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { handleApiError } from "../../../lib/api-error-handler"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const { limit = "20", offset = "0", category, search } = req.query as Record<string, string | undefined>

    let items = [
      {
        id: "pod_tshirt_01",
        title: "Custom T-Shirt",
        description: "Design your own custom t-shirt with high-quality print-on-demand production.",
        category: "Apparel",
        base_price: 1999,
        currency_code: "usd",
        thumbnail: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&h=600&fit=crop",
        image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&h=600&fit=crop",
        status: "available",
        options: ["S", "M", "L", "XL", "2XL"],
        print_areas: ["front", "back"],
        production_time: "3-5 business days",
      },
      {
        id: "pod_mug_01",
        title: "Custom Mug",
        description: "Personalized ceramic mug with your design, perfect for gifts and branding.",
        category: "Drinkware",
        base_price: 1299,
        currency_code: "usd",
        thumbnail: "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=800&h=600&fit=crop",
        image: "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=800&h=600&fit=crop",
        status: "available",
        options: ["11oz", "15oz"],
        print_areas: ["wrap"],
        production_time: "2-4 business days",
      },
      {
        id: "pod_poster_01",
        title: "Custom Poster",
        description: "High-quality poster printing on premium paper stock.",
        category: "Wall Art",
        base_price: 2499,
        currency_code: "usd",
        thumbnail: "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=800&h=600&fit=crop",
        image: "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=800&h=600&fit=crop",
        status: "available",
        options: ["12x18", "18x24", "24x36"],
        print_areas: ["front"],
        production_time: "2-3 business days",
      },
      {
        id: "pod_hoodie_01",
        title: "Custom Hoodie",
        description: "Premium custom hoodie with your artwork or logo.",
        category: "Apparel",
        base_price: 3999,
        currency_code: "usd",
        thumbnail: "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=800&h=600&fit=crop",
        image: "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=800&h=600&fit=crop",
        status: "available",
        options: ["S", "M", "L", "XL", "2XL"],
        print_areas: ["front", "back"],
        production_time: "5-7 business days",
      },
      {
        id: "pod_phonecase_01",
        title: "Custom Phone Case",
        description: "Durable custom phone case with your unique design.",
        category: "Accessories",
        base_price: 1599,
        currency_code: "usd",
        thumbnail: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800&h=600&fit=crop",
        image: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800&h=600&fit=crop",
        status: "available",
        options: ["iPhone 14", "iPhone 15", "Samsung S24"],
        print_areas: ["back"],
        production_time: "3-5 business days",
      },
    ]

    if (category) {
      items = items.filter((i) => i.category.toLowerCase() === category.toLowerCase())
    }
    if (search) {
      const s = search.toLowerCase()
      items = items.filter((i) => i.title.toLowerCase().includes(s) || i.description.toLowerCase().includes(s))
    }

    const start = Number(offset)
    const end = start + Number(limit)
    const paged = items.slice(start, end)

    return res.json({ items: paged, count: items.length, limit: Number(limit), offset: Number(offset) })
  } catch (error: any) {
    return handleApiError(res, error, "STORE-PRINT-ON-DEMAND")
  }
}
