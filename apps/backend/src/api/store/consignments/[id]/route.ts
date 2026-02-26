import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { handleApiError } from "../../../../lib/api-error-handler"

const SEED_ITEMS = [
  { id: "cons-1", name: "Vintage Rolex Datejust", description: "Authentic vintage Rolex Datejust from 1985 in excellent condition. Includes original box and papers. Recently serviced with new crystal.", category: "Jewelry & Watches", thumbnail: "/seed-images/auctions%2F1523170335258-f5ed11844a49.jpg", images: ["/seed-images/auctions%2F1523170335258-f5ed11844a49.jpg"], price: 450000, currency: "SAR", condition: "Excellent", status: "listed", commission_rate: 20, consignor: "Ahmed K.", listed_date: "2025-11-15T00:00:00Z" },
  { id: "cons-2", name: "Louis Vuitton Keepall 55", description: "Pre-owned Louis Vuitton Keepall 55 Monogram travel bag. Minor wear on handles, overall great condition. Authenticated by our experts.", category: "Fashion & Apparel", thumbnail: "/seed-images/consignments%2F1548036328-c9fa89d128fa.jpg", images: ["/seed-images/consignments%2F1548036328-c9fa89d128fa.jpg"], price: 380000, currency: "SAR", condition: "Good", status: "listed", commission_rate: 25, consignor: "Sara M.", listed_date: "2025-12-01T00:00:00Z" },
  { id: "cons-3", name: "Herman Miller Aeron Chair", description: "Gently used Herman Miller Aeron ergonomic office chair, Size B. Fully loaded with all adjustments. Perfect for home office setup.", category: "Furniture", thumbnail: "/seed-images/consignments%2F1580480055273-228ff5388ef8.jpg", images: ["/seed-images/consignments%2F1580480055273-228ff5388ef8.jpg"], price: 280000, currency: "SAR", condition: "Very Good", status: "listed", commission_rate: 30, consignor: "Omar R.", listed_date: "2025-10-20T00:00:00Z" },
  { id: "cons-4", name: "Original Oil Painting - Desert Sunset", description: "Stunning original oil on canvas painting depicting a Saudi desert sunset. Signed by local artist. Framed in ornate gold frame, 90x60cm.", category: "Art & Collectibles", thumbnail: "/seed-images/consignments%2F1578301978693-85fa9c0320b9.jpg", images: ["/seed-images/consignments%2F1578301978693-85fa9c0320b9.jpg"], price: 520000, currency: "SAR", condition: "Excellent", status: "listed", commission_rate: 20, consignor: "Fatima A.", listed_date: "2025-09-10T00:00:00Z" },
  { id: "cons-5", name: "MacBook Pro 16\" M2 Max", description: "Like-new MacBook Pro 16\" with M2 Max chip, 32GB RAM, 1TB SSD. AppleCare+ until 2026. Includes charger and original packaging.", category: "Electronics", thumbnail: "/seed-images/classifieds%2F1517336714731-489689fd1ca8.jpg", images: ["/seed-images/classifieds%2F1517336714731-489689fd1ca8.jpg"], price: 650000, currency: "SAR", condition: "Like New", status: "listed", commission_rate: 25, consignor: "Khalid S.", listed_date: "2025-11-28T00:00:00Z" },
]

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const query = req.scope.resolve("query") as any
    const { id } = req.params

    const { data: fulfillments } = await query.graph({
      entity: "fulfillment",
      fields: [
        "id",
        "tracking_links",
        "shipped_at",
        "delivered_at",
        "canceled_at",
        "created_at",
        "items.id",
        "items.title",
        "items.quantity",
      ],
      filters: { id },
    })

    const item = Array.isArray(fulfillments) ? fulfillments[0] : fulfillments
    if (!item) {
      const seed = SEED_ITEMS.find((s) => s.id === id) || SEED_ITEMS[0]
      return res.json({ item: { ...seed, id } })
    }

    return res.json({
      item: {
        ...item,
        status: item.delivered_at
          ? "delivered"
          : item.canceled_at
            ? "canceled"
            : item.shipped_at
              ? "shipped"
              : "processing",
      },
    })
  } catch (error: any) {
    const { id } = req.params
    const seed = SEED_ITEMS.find((s) => s.id === id) || SEED_ITEMS[0]
    return res.json({ item: { ...seed, id } })
  }
}
