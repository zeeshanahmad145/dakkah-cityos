import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { handleApiError } from "../../../lib/api-error-handler"

const SEED_CONSIGNMENTS = [
  { id: "con-1", title: "Vintage Rolex Submariner", description: "1978 Rolex Submariner in excellent condition with original box and papers.", category: "Jewelry & Watches", condition: "Excellent", estimated_value: 1250000, currency_code: "usd", status: "listed", thumbnail: "/seed-images/consignments/1578301978693-85fa9c0320b9.jpg", consignment_rate: 15, created_at: "2025-04-15T10:00:00Z" },
  { id: "con-2", title: "Herman Miller Eames Lounge Chair", description: "Authentic mid-century Eames lounge chair and ottoman in walnut and black leather.", category: "Furniture", condition: "Good", estimated_value: 450000, currency_code: "usd", status: "listed", thumbnail: "/seed-images/consignments/1548036328-c9fa89d128fa.jpg", consignment_rate: 20, created_at: "2025-04-20T14:30:00Z" },
  { id: "con-3", title: "Louis Vuitton Neverfull MM", description: "Gently used Louis Vuitton Neverfull MM in Damier Ebene with original dust bag.", category: "Fashion & Apparel", condition: "Very Good", estimated_value: 120000, currency_code: "usd", status: "listed", thumbnail: "/seed-images/consignments/1578301978693-85fa9c0320b9.jpg", consignment_rate: 18, created_at: "2025-05-01T09:15:00Z" },
  { id: "con-4", title: "Original Andy Warhol Print", description: "Authenticated Andy Warhol Campbell's Soup screen print, numbered edition.", category: "Art & Collectibles", condition: "Excellent", estimated_value: 850000, currency_code: "usd", status: "listed", thumbnail: "/seed-images/consignments/1548036328-c9fa89d128fa.jpg", consignment_rate: 12, created_at: "2025-03-28T11:00:00Z" },
  { id: "con-5", title: "MacBook Pro 16\" M3 Max", description: "Apple MacBook Pro 16-inch with M3 Max chip, 64GB RAM, barely used with AppleCare+.", category: "Electronics", condition: "Like New", estimated_value: 280000, currency_code: "usd", status: "listed", thumbnail: "/seed-images/consignments/1580480055273-228ff5388ef8.jpg", consignment_rate: 15, created_at: "2025-05-10T16:45:00Z" },
]

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const customerId = req.auth_context?.actor_id

  if (!customerId) {
    return res.json({
      consignments: SEED_CONSIGNMENTS,
      items: SEED_CONSIGNMENTS,
      count: SEED_CONSIGNMENTS.length,
      limit: 20,
      offset: 0,
      public_info: {
        title: "Consignment Services",
        description: "Sell your items through our marketplace with our consignment program.",
        how_it_works: [
          "Submit your items for consignment review",
          "We evaluate and list approved items in our store",
          "Items are sold at agreed-upon prices",
          "You receive your share once the item sells",
        ],
        benefits: [
          "No upfront costs to list your items",
          "Professional photography and listing creation",
          "Secure handling and storage",
          "Competitive commission rates",
        ],
        categories: ["Fashion & Apparel", "Electronics", "Furniture", "Art & Collectibles", "Jewelry & Watches"],
      },
    })
  }

  const { limit = "20", offset = "0", tenant_id } = req.query as Record<string, string | undefined>

  try {
    const query = req.scope.resolve("query") as any

    const { data: orders } = await query.graph({
      entity: "order",
      fields: [
        "id",
        "display_id",
        "status",
        "fulfillments.id",
        "fulfillments.tracking_links",
        "fulfillments.shipped_at",
        "fulfillments.delivered_at",
        "fulfillments.canceled_at",
        "fulfillments.created_at",
        "fulfillments.items.id",
        "fulfillments.items.title",
        "fulfillments.items.quantity",
      ],
      filters: { customer_id: customerId },
      pagination: {
        skip: Number(offset),
        take: Number(limit),
        order: { created_at: "DESC" },
      },
    })

    const consignments = (Array.isArray(orders) ? orders : []).flatMap((order: any) =>
      (order.fulfillments || []).map((f: any) => ({
        id: f.id,
        order_id: order.id,
        order_display_id: order.display_id,
        tracking_links: f.tracking_links || [],
        shipped_at: f.shipped_at,
        delivered_at: f.delivered_at,
        canceled_at: f.canceled_at,
        created_at: f.created_at,
        items: f.items || [],
        status: f.delivered_at
          ? "delivered"
          : f.canceled_at
            ? "canceled"
            : f.shipped_at
              ? "shipped"
              : "processing",
      }))
    )

    res.json({
      consignments,
      count: consignments.length,
      limit: Number(limit),
      offset: Number(offset),
    })
  } catch (error: any) {
    handleApiError(res, error, "STORE-CONSIGNMENTS")}
}

