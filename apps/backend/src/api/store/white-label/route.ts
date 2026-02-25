import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { handleApiError } from "../../../lib/api-error-handler"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const { limit = "20", offset = "0", category, search } = req.query as Record<string, string | undefined>

    let items = [
      {
        id: "wl_skincare_01",
        title: "Private Label Skincare Line",
        description: "Launch your own branded skincare line with our white-label manufacturing. Includes moisturizer, cleanser, and serum.",
        category: "Beauty & Skincare",
        base_price: 14999,
        currency_code: "usd",
        thumbnail: "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=800&h=600&fit=crop",
        status: "available",
        min_order_quantity: 100,
        lead_time: "4-6 weeks",
        customization: ["Logo", "Packaging Design", "Fragrance", "Ingredients"],
      },
      {
        id: "wl_supplement_01",
        title: "Custom Supplement Brand",
        description: "Create your own supplement brand with our white-label solutions. FDA-compliant manufacturing.",
        category: "Health & Supplements",
        base_price: 9999,
        currency_code: "usd",
        thumbnail: "https://images.unsplash.com/photo-1550572017-edd951aa8f72?w=800&h=600&fit=crop",
        status: "available",
        min_order_quantity: 250,
        lead_time: "6-8 weeks",
        customization: ["Formula", "Packaging", "Label Design", "Capsule Color"],
      },
      {
        id: "wl_coffee_01",
        title: "White Label Coffee Brand",
        description: "Start your own coffee brand with premium roasted beans and custom packaging.",
        category: "Food & Beverage",
        base_price: 7999,
        currency_code: "usd",
        thumbnail: "https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=800&h=600&fit=crop",
        status: "available",
        min_order_quantity: 50,
        lead_time: "2-3 weeks",
        customization: ["Roast Level", "Blend", "Packaging", "Label"],
      },
      {
        id: "wl_clothing_01",
        title: "Private Label Clothing Line",
        description: "Design and launch your own clothing brand with our white-label apparel manufacturing.",
        category: "Fashion",
        base_price: 19999,
        currency_code: "usd",
        thumbnail: "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=800&h=600&fit=crop",
        status: "available",
        min_order_quantity: 200,
        lead_time: "8-12 weeks",
        customization: ["Design", "Fabric", "Labels", "Packaging", "Sizing"],
      },
      {
        id: "wl_candle_01",
        title: "Custom Candle Brand",
        description: "Launch a luxury candle brand with your custom scents and packaging.",
        category: "Home & Living",
        base_price: 5999,
        currency_code: "usd",
        thumbnail: "https://images.unsplash.com/photo-1602028915047-37269d1a73f7?w=800&h=600&fit=crop",
        status: "available",
        min_order_quantity: 100,
        lead_time: "3-4 weeks",
        customization: ["Scent", "Wax Type", "Container", "Label Design"],
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
    return handleApiError(res, error, "STORE-WHITE-LABEL")
  }
}
