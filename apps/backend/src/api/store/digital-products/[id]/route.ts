import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

const SEED_DATA = [
  { id: "dp-1", title: "Complete Web Development Bootcamp", description: "Master HTML, CSS, JavaScript, React, Node.js and more in this comprehensive course.", file_type: "video", file_size_bytes: 5368709120, preview_url: null, version: "3.0", max_downloads: null, is_active: true, thumbnail: "/seed-images/digital-products%2F1517694712202-14dd9538aa97.jpg", metadata: { thumbnail: "/seed-images/digital-products%2F1517694712202-14dd9538aa97.jpg", price: 4999, category: "software", rating: 4.8, currency_code: "USD" }, reviews: [
    { author: "Marcus J.", rating: 5, comment: "Best web dev course I've taken. The React section alone is worth the price. Very hands-on.", created_at: "2025-12-10T10:00:00Z" },
    { author: "Emily R.", rating: 5, comment: "Went from zero to building full-stack apps in 3 months. Instructor explains complex topics clearly.", created_at: "2025-12-07T14:30:00Z" },
    { author: "Daniel K.", rating: 4, comment: "Comprehensive coverage of modern web tech. Node.js section could use more advanced examples.", created_at: "2025-12-03T09:15:00Z" },
    { author: "Priya S.", rating: 4, comment: "Great for beginners and intermediate developers. The project-based approach is very effective.", created_at: "2025-11-29T16:45:00Z" },
    { author: "Tom W.", rating: 5, comment: "Version 3.0 update is fantastic. New content on TypeScript and Next.js is very relevant.", created_at: "2025-11-25T11:00:00Z" },
  ] },
  { id: "dp-2", title: "Premium UI Kit - Dashboard Templates", description: "200+ responsive dashboard components for Figma and Sketch with dark/light mode support.", file_type: "archive", file_size_bytes: 157286400, preview_url: null, version: "2.1", max_downloads: 5, is_active: true, thumbnail: "/seed-images/digital-products%2F1545235617-9465d2a55698.jpg", metadata: { thumbnail: "/seed-images/digital-products%2F1545235617-9465d2a55698.jpg", price: 2999, category: "template", rating: 4.6, currency_code: "USD" }, reviews: [
    { author: "Lisa Chen", rating: 5, comment: "Saved our team weeks of design work. Components are well-organized and fully customizable.", created_at: "2025-12-09T13:20:00Z" },
    { author: "James H.", rating: 4, comment: "Dark mode support is excellent. Some components needed minor tweaks but overall top quality.", created_at: "2025-12-05T10:00:00Z" },
    { author: "Sophie M.", rating: 5, comment: "Best UI kit I've purchased. Regular updates and new components added frequently.", created_at: "2025-12-01T15:45:00Z" },
    { author: "Kevin P.", rating: 4, comment: "Great value for 200+ components. Figma organization is clean and professional.", created_at: "2025-11-27T09:30:00Z" },
    { author: "Anna L.", rating: 3, comment: "Good kit but Sketch version lags behind Figma in updates. Components are well-designed though.", created_at: "2025-11-23T12:15:00Z" },
  ] },
  { id: "dp-3", title: "The Art of Digital Marketing - eBook", description: "A comprehensive guide covering SEO, social media, email marketing, and paid advertising strategies.", file_type: "ebook", file_size_bytes: 15728640, preview_url: null, version: "1.5", max_downloads: 3, is_active: true, thumbnail: "/seed-images/digital-products%2F1544716278-ca5e3f4abd8c.jpg", metadata: { thumbnail: "/seed-images/digital-products%2F1544716278-ca5e3f4abd8c.jpg", price: 1499, category: "ebook", rating: 4.5, currency_code: "USD" }, reviews: [
    { author: "Rachel T.", rating: 5, comment: "Comprehensive marketing guide that actually delivers actionable insights. Worth every penny.", created_at: "2025-12-08T11:30:00Z" },
    { author: "Mark D.", rating: 4, comment: "Great overview of digital marketing channels. SEO chapter is particularly well-written.", created_at: "2025-12-04T14:00:00Z" },
    { author: "Nina A.", rating: 4, comment: "Helped me develop a complete marketing strategy for my startup. Clear and practical.", created_at: "2025-11-30T09:45:00Z" },
    { author: "Brian F.", rating: 5, comment: "The paid advertising section alone saved me thousands in wasted ad spend. Highly recommend.", created_at: "2025-11-26T16:20:00Z" },
    { author: "Chloe B.", rating: 3, comment: "Good fundamentals but some strategies feel dated. Would love a 2026 edition update.", created_at: "2025-11-22T10:30:00Z" },
  ] },
  { id: "dp-4", title: "Ambient Music Collection - Focus & Study", description: "50 high-quality ambient tracks perfect for deep work, studying, and meditation.", file_type: "audio", file_size_bytes: 1073741824, preview_url: null, version: "1.0", max_downloads: null, is_active: true, thumbnail: "/seed-images/digital-products%2F1506744038136-46273834b3fb.jpg", metadata: { thumbnail: "/seed-images/digital-products%2F1506744038136-46273834b3fb.jpg", price: 999, category: "audio", rating: 4.7, currency_code: "USD" }, reviews: [
    { author: "Sam G.", rating: 5, comment: "These tracks have become essential for my daily deep work sessions. Production quality is superb.", created_at: "2025-12-10T09:00:00Z" },
    { author: "Olivia N.", rating: 5, comment: "Perfect for studying. No distracting melodies, just pure ambient soundscapes. Love it.", created_at: "2025-12-06T12:45:00Z" },
    { author: "Ryan C.", rating: 4, comment: "Great variety of ambient tracks. Some are better for meditation, others for focused work.", created_at: "2025-12-02T16:30:00Z" },
    { author: "Hannah V.", rating: 4, comment: "High-quality audio files. I use them in my yoga studio and clients love the atmosphere.", created_at: "2025-11-28T10:15:00Z" },
    { author: "Leo Z.", rating: 5, comment: "50 tracks means endless variety. Haven't gotten tired of any of them after months of use.", created_at: "2025-11-24T14:00:00Z" },
  ] },
  { id: "dp-5", title: "Stock Photo Bundle - Nature & Landscapes", description: "500 high-resolution nature photographs licensed for commercial use in any project.", file_type: "image", file_size_bytes: 3221225472, preview_url: null, version: "1.2", max_downloads: 2, is_active: true, thumbnail: "/seed-images/digital-products%2F1506744038136-46273834b3fb.jpg", metadata: { thumbnail: "/seed-images/digital-products%2F1506744038136-46273834b3fb.jpg", price: 3999, category: "image", rating: 4.9, currency_code: "USD" }, reviews: [
    { author: "Victoria P.", rating: 5, comment: "Incredible photo quality. These images elevated our entire website redesign. Commercial license is a huge plus.", created_at: "2025-12-09T10:30:00Z" },
    { author: "Andrew M.", rating: 5, comment: "500 photos at this quality is an amazing deal. Each one could sell individually for more.", created_at: "2025-12-05T15:00:00Z" },
    { author: "Grace L.", rating: 5, comment: "Used these for our marketing campaigns. The landscape shots are absolutely stunning.", created_at: "2025-12-01T11:20:00Z" },
    { author: "Derek W.", rating: 4, comment: "Great collection but wish there were more tropical scenes. Mountain and forest shots are exceptional.", created_at: "2025-11-27T14:45:00Z" },
    { author: "Megan H.", rating: 4, comment: "High-res files perfect for print and digital use. Version 1.2 added some beautiful sunset shots.", created_at: "2025-11-23T09:00:00Z" },
  ] },
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
