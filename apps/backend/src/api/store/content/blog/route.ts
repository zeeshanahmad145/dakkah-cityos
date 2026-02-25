import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

const SEED_DATA = [
  {
    id: "blog-1",
    title: "The Future of E-Commerce in 2026",
    excerpt: "Explore the latest trends shaping online retail, from AI-powered personalization to sustainable packaging solutions.",
    category: "tech",
    author: "Sarah Mitchell",
    publishedAt: "2026-02-10T09:00:00Z",
    read_time: "6 min read",
    thumbnail: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=600&fit=crop",
  },
  {
    id: "blog-2",
    title: "10 Tips for Building a Successful Online Store",
    excerpt: "From product photography to customer retention strategies, learn the essentials of running a thriving e-commerce business.",
    category: "guides",
    author: "Ahmed Al-Rashid",
    publishedAt: "2026-02-08T14:30:00Z",
    read_time: "8 min read",
    thumbnail: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&h=600&fit=crop",
  },
  {
    id: "blog-3",
    title: "Smart City Infrastructure: A New Era of Urban Living",
    excerpt: "How IoT sensors, digital twins, and connected platforms are transforming the way cities operate and serve citizens.",
    category: "tech",
    author: "Dr. Fatima Khan",
    publishedAt: "2026-02-05T11:00:00Z",
    read_time: "10 min read",
    thumbnail: "https://images.unsplash.com/photo-1573164713988-8665fc963095?w=800&h=600&fit=crop",
  },
  {
    id: "blog-4",
    title: "Sustainable Fashion: Making Ethical Choices Easy",
    excerpt: "A guide to building a conscious wardrobe without compromising on style or breaking the bank.",
    category: "lifestyle",
    author: "Layla Hassan",
    publishedAt: "2026-02-03T08:00:00Z",
    read_time: "5 min read",
    thumbnail: "https://images.unsplash.com/photo-1558171813-4c088753af8f?w=800&h=600&fit=crop",
  },
  {
    id: "blog-5",
    title: "How Small Businesses Can Compete in the Digital Marketplace",
    excerpt: "Practical strategies for small business owners to leverage technology, social media, and marketplace platforms.",
    category: "business",
    author: "Omar Khaled",
    publishedAt: "2026-01-28T16:00:00Z",
    read_time: "7 min read",
    thumbnail: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&h=600&fit=crop",
  },
]

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    return res.json({
      posts: SEED_DATA,
      count: SEED_DATA.length,
    })
  } catch (error: any) {
    return res.status(500).json({ message: error.message || "Internal server error" })
  }
}
