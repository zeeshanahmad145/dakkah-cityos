import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { handleApiError } from "../../../../lib/api-error-handler"
import { enrichDetailItem } from "../../../../lib/detail-enricher"

const SEED_ITEMS = [
  { id: "cons-1", name: "Vintage Rolex Datejust", description: "Authentic vintage Rolex Datejust from 1985 in excellent condition. Includes original box and papers. Recently serviced with new crystal.", category: "Jewelry & Watches", thumbnail: "/seed-images/auctions/1523170335258-f5ed11844a49.jpg", images: ["/seed-images/auctions/1523170335258-f5ed11844a49.jpg"], price: 450000, currency: "SAR", condition: "Excellent", status: "listed", commission_rate: 20, consignor: "Ahmed K.", listed_date: "2025-11-15T00:00:00Z", reviews: [
    { author: "Mansour A.", rating: 5, comment: "Absolutely stunning timepiece. Authentication was verified independently. Original box and papers are a huge plus.", created_at: "2025-12-10T10:00:00Z" },
    { author: "Leila K.", rating: 5, comment: "The Rolex is in impeccable condition for its age. Service records were provided and everything checks out.", created_at: "2025-12-07T14:30:00Z" },
    { author: "Tariq S.", rating: 4, comment: "Beautiful watch with genuine patina. Crystal replacement was done professionally. Fair price.", created_at: "2025-12-03T09:15:00Z" },
    { author: "Nada M.", rating: 4, comment: "Great consignment experience. The watch was well-documented and the process was transparent.", created_at: "2025-11-29T16:45:00Z" },
    { author: "Faris H.", rating: 5, comment: "Dream watch at a great price. The consignment team handled everything professionally.", created_at: "2025-11-25T11:00:00Z" },
  ] },
  { id: "cons-2", name: "Louis Vuitton Keepall 55", description: "Pre-owned Louis Vuitton Keepall 55 Monogram travel bag. Minor wear on handles, overall great condition. Authenticated by our experts.", category: "Fashion & Apparel", thumbnail: "/seed-images/consignments/1548036328-c9fa89d128fa.jpg", images: ["/seed-images/consignments/1548036328-c9fa89d128fa.jpg"], price: 380000, currency: "SAR", condition: "Good", status: "listed", commission_rate: 25, consignor: "Sara M.", listed_date: "2025-12-01T00:00:00Z", reviews: [
    { author: "Haya R.", rating: 5, comment: "Authentic LV bag in great condition. The handle wear was minimal and as described. Love it!", created_at: "2025-12-09T13:20:00Z" },
    { author: "Saud F.", rating: 4, comment: "Perfect travel companion. Authentication certificate gave me confidence in the purchase.", created_at: "2025-12-06T10:00:00Z" },
    { author: "Maha T.", rating: 4, comment: "Good value for a pre-owned luxury item. The monogram canvas is in excellent shape.", created_at: "2025-12-02T15:45:00Z" },
    { author: "Ali B.", rating: 3, comment: "Bag is nice but the handle wear was slightly more than photos showed. Still a good deal.", created_at: "2025-11-28T09:30:00Z" },
    { author: "Reem D.", rating: 5, comment: "Wonderful find! The consignment process was smooth and the bag exceeded my expectations.", created_at: "2025-11-24T12:15:00Z" },
  ] },
  { id: "cons-3", name: "Herman Miller Aeron Chair", description: "Gently used Herman Miller Aeron ergonomic office chair, Size B. Fully loaded with all adjustments. Perfect for home office setup.", category: "Furniture", thumbnail: "/seed-images/consignments/1580480055273-228ff5388ef8.jpg", images: ["/seed-images/consignments/1580480055273-228ff5388ef8.jpg"], price: 280000, currency: "SAR", condition: "Very Good", status: "listed", commission_rate: 30, consignor: "Omar R.", listed_date: "2025-10-20T00:00:00Z", reviews: [
    { author: "Fahad N.", rating: 5, comment: "Best office chair I've ever owned. All adjustments work perfectly. Huge savings over new.", created_at: "2025-12-08T11:30:00Z" },
    { author: "Dalal A.", rating: 4, comment: "Chair is in great condition. Mesh is clean and all mechanisms function smoothly.", created_at: "2025-12-04T14:00:00Z" },
    { author: "Youssef K.", rating: 5, comment: "My back thanks me every day. Worth every riyal even at consignment prices.", created_at: "2025-11-30T09:45:00Z" },
    { author: "Noura S.", rating: 4, comment: "Good quality pre-owned chair. Minor scuff on the base but functionally perfect.", created_at: "2025-11-26T16:20:00Z" },
    { author: "Hamad W.", rating: 3, comment: "Decent chair but the armrest pads show more wear than described. Still comfortable.", created_at: "2025-11-22T10:30:00Z" },
  ] },
  { id: "cons-4", name: "Original Oil Painting - Desert Sunset", description: "Stunning original oil on canvas painting depicting a Saudi desert sunset. Signed by local artist. Framed in ornate gold frame, 90x60cm.", category: "Art & Collectibles", thumbnail: "/seed-images/consignments/1578301978693-85fa9c0320b9.jpg", images: ["/seed-images/consignments/1578301978693-85fa9c0320b9.jpg"], price: 520000, currency: "SAR", condition: "Excellent", status: "listed", commission_rate: 20, consignor: "Fatima A.", listed_date: "2025-09-10T00:00:00Z", reviews: [
    { author: "Amal G.", rating: 5, comment: "Breathtaking artwork. The colors capture the desert light perfectly. A masterpiece for my collection.", created_at: "2025-12-07T15:00:00Z" },
    { author: "Badr M.", rating: 5, comment: "Supporting local art is important. This painting is stunning and the frame is beautifully ornate.", created_at: "2025-12-03T11:30:00Z" },
    { author: "Salma R.", rating: 4, comment: "Beautiful painting. The gold frame adds elegance. Slight color variation from online photos.", created_at: "2025-11-29T14:15:00Z" },
    { author: "Nawaf T.", rating: 4, comment: "Great investment piece. The artist is gaining recognition and this is a signed original.", created_at: "2025-11-25T10:45:00Z" },
    { author: "Lulwa H.", rating: 5, comment: "Absolutely love this piece. It's the focal point of our majlis now. Highly recommend.", created_at: "2025-11-21T13:30:00Z" },
  ] },
  { id: "cons-5", name: "MacBook Pro 16\" M2 Max", description: "Like-new MacBook Pro 16\" with M2 Max chip, 32GB RAM, 1TB SSD. AppleCare+ until 2026. Includes charger and original packaging.", category: "Electronics", thumbnail: "/seed-images/classifieds/1517336714731-489689fd1ca8.jpg", images: ["/seed-images/classifieds/1517336714731-489689fd1ca8.jpg"], price: 650000, currency: "SAR", condition: "Like New", status: "listed", commission_rate: 25, consignor: "Khalid S.", listed_date: "2025-11-28T00:00:00Z", reviews: [
    { author: "Rashid Y.", rating: 5, comment: "Powerhouse machine in perfect condition. Battery cycle count was only 45. Incredible value.", created_at: "2025-12-10T09:00:00Z" },
    { author: "Jana F.", rating: 5, comment: "Like buying new at a fraction of the price. AppleCare+ transfer was seamless.", created_at: "2025-12-06T12:45:00Z" },
    { author: "Saeed B.", rating: 4, comment: "Great laptop, performs flawlessly. Original packaging included which is always nice.", created_at: "2025-12-02T16:30:00Z" },
    { author: "Ghada K.", rating: 4, comment: "Solid machine for creative work. No dead pixels, no keyboard issues. Very satisfied.", created_at: "2025-11-28T10:15:00Z" },
    { author: "Mazen A.", rating: 3, comment: "Good laptop but charger had some cable fraying. MacBook itself is in excellent shape.", created_at: "2025-11-24T14:00:00Z" },
  ] },
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
      item: enrichDetailItem({
        ...item,
        status: item.delivered_at
          ? "delivered"
          : item.canceled_at
            ? "canceled"
            : item.shipped_at
              ? "shipped"
              : "processing",
      }, "consignments"),
    })
  } catch (error: any) {
    const { id } = req.params
    const seed = SEED_ITEMS.find((s) => s.id === id) || SEED_ITEMS[0]
    return res.json({ item: { ...seed, id } })
  }
}
