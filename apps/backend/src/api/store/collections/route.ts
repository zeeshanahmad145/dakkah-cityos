import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

export const AUTHENTICATE = false

const COLLECTION_THUMBNAILS: Record<string, string> = {
  "riyadh-essentials": "/seed-images/content/1586724237569-f3d0c1dee8c6.jpg",
  "winter-collection": "/seed-images/content/1548013146-72479768bada.jpg",
  "electronics-tech": "/seed-images/content/1573164713988-8665fc963095.jpg",
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const query = req.scope.resolve("query") as any
    const { data: collections, metadata } = await query.graph({
      entity: "product_collection",
      fields: ["id", "title", "handle", "metadata", "created_at", "updated_at"],
      pagination: {
        skip: Number(req.query.offset || 0),
        take: Number(req.query.limit || 20),
      },
    })

    const enriched = (collections || []).map((c: any) => ({
      ...c,
      thumbnail: COLLECTION_THUMBNAILS[c.handle] || "/seed-images/content/1558171813-4c088753af8f.jpg",
    }))

    return res.json({
      collections: enriched,
      count: metadata?.count ?? enriched.length,
      offset: Number(req.query.offset || 0),
      limit: Number(req.query.limit || 20),
    })
  } catch (error: any) {
    const fallbackCollections = [
      {
        id: "pcol_01",
        title: "Riyadh Essentials",
        handle: "riyadh-essentials",
        thumbnail: "/seed-images/content/1586724237569-f3d0c1dee8c6.jpg",
        metadata: null,
        created_at: "2025-01-01T00:00:00Z",
        updated_at: "2025-01-01T00:00:00Z",
      },
      {
        id: "pcol_02",
        title: "Winter Collection",
        handle: "winter-collection",
        thumbnail: "/seed-images/content/1548013146-72479768bada.jpg",
        metadata: null,
        created_at: "2025-01-01T00:00:00Z",
        updated_at: "2025-01-01T00:00:00Z",
      },
      {
        id: "pcol_03",
        title: "Electronics & Tech",
        handle: "electronics-tech",
        thumbnail: "/seed-images/content/1573164713988-8665fc963095.jpg",
        metadata: null,
        created_at: "2025-01-01T00:00:00Z",
        updated_at: "2025-01-01T00:00:00Z",
      },
    ]
    return res.json({
      collections: fallbackCollections,
      count: fallbackCollections.length,
      offset: 0,
      limit: 20,
    })
  }
}
