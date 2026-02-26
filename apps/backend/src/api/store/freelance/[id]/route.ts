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
      thumbnail: "/seed-images/freelance%2F1461749280684-dccba630e2f6.jpg",
      images: ["/seed-images/freelance%2F1461749280684-dccba630e2f6.jpg"],
      price: 5000,
      rating: 4.9,
    },
    delivery_time_days: 14,
    revisions_included: 3,
    status: "active",
    packages: [
      { name: "Basic", price: 2500, delivery_time: 7, description: "Simple landing page", features: ["1 page design", "Responsive layout", "Basic SEO", "1 revision"] },
      { name: "Standard", price: 5000, delivery_time: 14, description: "Multi-page website", features: ["Up to 5 pages", "Responsive design", "SEO optimization", "3 revisions", "Contact form"] },
      { name: "Premium", price: 10000, delivery_time: 21, description: "Full-stack web application", features: ["Unlimited pages", "Custom backend", "Database integration", "5 revisions", "Admin panel", "API development"] },
    ],
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
      thumbnail: "/seed-images/freelance%2F1532094349884-543bc11b234d.jpg",
      images: ["/seed-images/freelance%2F1532094349884-543bc11b234d.jpg"],
      price: 3500,
      rating: 4.8,
    },
    delivery_time_days: 7,
    revisions_included: 5,
    status: "active",
    packages: [
      { name: "Basic", price: 1500, delivery_time: 3, description: "Logo design only", features: ["2 logo concepts", "1 revision", "PNG format"] },
      { name: "Standard", price: 3500, delivery_time: 7, description: "Logo + brand kit", features: ["4 logo concepts", "Color palette", "Typography guide", "3 revisions", "Vector files"] },
      { name: "Premium", price: 7000, delivery_time: 14, description: "Complete brand identity", features: ["6 logo concepts", "Brand guidelines", "Business cards", "5 revisions", "Social media kit", "Stationery design"] },
    ],
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
      thumbnail: "/seed-images/freelance%2F1532629345422-7515f3d16bb6.jpg",
      images: ["/seed-images/freelance%2F1532629345422-7515f3d16bb6.jpg"],
      price: 1500,
      rating: 4.7,
    },
    delivery_time_days: 3,
    revisions_included: 2,
    status: "active",
    packages: [
      { name: "Basic", price: 500, delivery_time: 1, description: "1 blog post", features: ["500-word article", "SEO keywords", "1 revision"] },
      { name: "Standard", price: 1500, delivery_time: 3, description: "3 blog posts", features: ["800-word articles", "SEO optimization", "Meta descriptions", "2 revisions"] },
      { name: "Premium", price: 3500, delivery_time: 7, description: "Content strategy + posts", features: ["5 articles", "Keyword research", "Content calendar", "3 revisions", "Social snippets"] },
    ],
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
      thumbnail: "/seed-images/digital-products%2F1517694712202-14dd9538aa97.jpg",
      images: ["/seed-images/digital-products%2F1517694712202-14dd9538aa97.jpg"],
      price: 7500,
      rating: 5.0,
    },
    delivery_time_days: 10,
    revisions_included: 2,
    status: "active",
    packages: [
      { name: "Basic", price: 3000, delivery_time: 5, description: "Basic video edit", features: ["Up to 5 min video", "Color correction", "Background music", "1 revision"] },
      { name: "Standard", price: 7500, delivery_time: 10, description: "Professional edit", features: ["Up to 15 min video", "Motion graphics", "Sound design", "2 revisions", "Thumbnail design"] },
      { name: "Premium", price: 15000, delivery_time: 21, description: "Full production", features: ["Up to 30 min video", "Advanced VFX", "Custom animations", "3 revisions", "Multiple formats", "Social media cuts"] },
    ],
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
      thumbnail: "/seed-images/content%2F1460925895917-afdab827c52f.jpg",
      images: ["/seed-images/content%2F1460925895917-afdab827c52f.jpg"],
      price: 4000,
      rating: 4.6,
    },
    delivery_time_days: 30,
    revisions_included: 4,
    status: "active",
    packages: [
      { name: "Basic", price: 2000, delivery_time: 14, description: "Social media setup", features: ["Platform audit", "Profile optimization", "Content calendar", "1 revision"] },
      { name: "Standard", price: 4000, delivery_time: 30, description: "Monthly management", features: ["3 platforms managed", "12 posts/month", "Analytics report", "Ad campaign setup", "2 revisions"] },
      { name: "Premium", price: 8000, delivery_time: 30, description: "Full digital strategy", features: ["5 platforms managed", "20 posts/month", "PPC campaigns", "SEO strategy", "Monthly reporting", "4 revisions"] },
    ],
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
