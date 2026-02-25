import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { handleApiError } from "../../../../lib/api-error-handler"

const SEED_DATA = [
  {
    id: "free-seed-001",
    title: "Professional Website Development",
    description: "Full-stack web development using React, Node.js, and modern frameworks. Responsive design, SEO optimization, and performance tuning included.",
    category: "web_development",
    subcategory: "full_stack",
    listing_type: "fixed_price",
    currency_code: "SAR",
    metadata: {
      thumbnail: "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=800&h=600&fit=crop",
      images: ["https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=800&h=600&fit=crop"],
      price: 5000,
      rating: 4.9,
    },
    delivery_time_days: 14,
    revisions_included: 3,
    status: "active",
  },
  {
    id: "free-seed-002",
    title: "Brand Identity & Logo Design",
    description: "Complete brand identity package including logo, color palette, typography, and brand guidelines. Unique, memorable designs.",
    category: "design",
    subcategory: "branding",
    listing_type: "fixed_price",
    currency_code: "SAR",
    metadata: {
      thumbnail: "https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=800&h=600&fit=crop",
      images: ["https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=800&h=600&fit=crop"],
      price: 3500,
      rating: 4.8,
    },
    delivery_time_days: 7,
    revisions_included: 5,
    status: "active",
  },
  {
    id: "free-seed-003",
    title: "SEO Content Writing & Blog Posts",
    description: "High-quality, SEO-optimized content writing for blogs, websites, and marketing materials. Research-driven and engaging.",
    category: "writing",
    subcategory: "content_writing",
    listing_type: "fixed_price",
    currency_code: "SAR",
    metadata: {
      thumbnail: "https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?w=800&h=600&fit=crop",
      images: ["https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?w=800&h=600&fit=crop"],
      price: 1500,
      rating: 4.7,
    },
    delivery_time_days: 3,
    revisions_included: 2,
    status: "active",
  },
  {
    id: "free-seed-004",
    title: "Professional Video Editing & Motion Graphics",
    description: "Expert video editing with color grading, motion graphics, sound design, and visual effects for YouTube, ads, and social media.",
    category: "video",
    subcategory: "editing",
    listing_type: "hourly",
    currency_code: "SAR",
    metadata: {
      thumbnail: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&h=600&fit=crop",
      images: ["https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&h=600&fit=crop"],
      price: 7500,
      rating: 5.0,
    },
    delivery_time_days: 10,
    revisions_included: 2,
    status: "active",
  },
  {
    id: "free-seed-005",
    title: "Digital Marketing & Social Media Strategy",
    description: "Comprehensive digital marketing strategy including social media management, PPC campaigns, and analytics reporting.",
    category: "marketing",
    subcategory: "social_media",
    listing_type: "milestone",
    currency_code: "SAR",
    metadata: {
      thumbnail: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=600&fit=crop",
      images: ["https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=600&fit=crop"],
      price: 4000,
      rating: 4.6,
    },
    delivery_time_days: 30,
    revisions_included: 4,
    status: "active",
  },
]

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const mod = req.scope.resolve("freelance") as any
    const { id } = req.params
    const item = await mod.retrieveGigListing(id)
    if (item) return res.json({ item })
    const seedItem = SEED_DATA.find((s) => s.id === id) || SEED_DATA[0]
    return res.json({ item: seedItem })
  } catch (error: any) {
    const { id } = req.params
    const seedItem = SEED_DATA.find((s) => s.id === id) || SEED_DATA[0]
    return res.json({ item: seedItem })
  }
}
