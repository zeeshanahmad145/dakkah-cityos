import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

const SEED_DATA = [
  { id: "dp-1", title: "Complete Web Development Bootcamp", description: "Master HTML, CSS, JavaScript, React, Node.js and more in this comprehensive course.", file_type: "video", file_size_bytes: 5368709120, preview_url: null, version: "3.0", max_downloads: null, is_active: true, metadata: { thumbnail: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&h=600&fit=crop", price: 4999, category: "software", rating: 4.8, currency_code: "USD" } },
  { id: "dp-2", title: "Premium UI Kit - Dashboard Templates", description: "200+ responsive dashboard components for Figma and Sketch with dark/light mode support.", file_type: "archive", file_size_bytes: 157286400, preview_url: null, version: "2.1", max_downloads: 5, is_active: true, metadata: { thumbnail: "https://images.unsplash.com/photo-1545235617-9465d2a55698?w=800&h=600&fit=crop", price: 2999, category: "template", rating: 4.6, currency_code: "USD" } },
  { id: "dp-3", title: "The Art of Digital Marketing - eBook", description: "A comprehensive guide covering SEO, social media, email marketing, and paid advertising strategies.", file_type: "ebook", file_size_bytes: 15728640, preview_url: null, version: "1.5", max_downloads: 3, is_active: true, metadata: { thumbnail: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800&h=600&fit=crop", price: 1499, category: "ebook", rating: 4.5, currency_code: "USD" } },
  { id: "dp-4", title: "Ambient Music Collection - Focus & Study", description: "50 high-quality ambient tracks perfect for deep work, studying, and meditation.", file_type: "audio", file_size_bytes: 1073741824, preview_url: null, version: "1.0", max_downloads: null, is_active: true, metadata: { thumbnail: "https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=800&h=600&fit=crop", price: 999, category: "audio", rating: 4.7, currency_code: "USD" } },
  { id: "dp-5", title: "Stock Photo Bundle - Nature & Landscapes", description: "500 high-resolution nature photographs licensed for commercial use in any project.", file_type: "image", file_size_bytes: 3221225472, preview_url: null, version: "1.2", max_downloads: 2, is_active: true, metadata: { thumbnail: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&h=600&fit=crop", price: 3999, category: "image", rating: 4.9, currency_code: "USD" } },
]

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const mod = req.scope.resolve("digitalProduct") as any
    const { id } = req.params
    const item = await mod.retrieveDigitalAsset(id)
    if (!item) {
      const seedItem = SEED_DATA.find(i => i.id === id) || SEED_DATA[0]
      return res.json({ item: seedItem })
    }
    return res.json({ item })
  } catch (error: any) {
    const { id } = req.params
    const seedItem = SEED_DATA.find(i => i.id === id) || SEED_DATA[0]
    return res.json({ item: seedItem })
  }
}
