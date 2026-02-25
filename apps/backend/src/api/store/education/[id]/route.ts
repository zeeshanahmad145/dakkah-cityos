import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { handleApiError } from "../../../../lib/api-error-handler"

const SEED_DATA = [
  {
    id: "edu_seed_01",
    tenant_id: "tenant_seed",
    title: "Full-Stack Web Development Bootcamp",
    description: "Master modern web development with React, Node.js, and cloud deployment. Build real-world projects and launch your tech career.",
    short_description: "Master React, Node.js, and cloud deployment",
    category: "technology",
    subcategory: "web_development",
    level: "beginner",
    format: "online",
    language: "English",
    currency_code: "USD",
    price: 19900,
    rating: 4.8,
    instructor_name: "Sarah Chen",
    enrolled_count: 3450,
    status: "published",
    thumbnail: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&h=600&fit=crop",
    metadata: {
      thumbnail: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&h=600&fit=crop",
      images: ["https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&h=600&fit=crop"],
      price: 19900,
      rating: 4.8,
      instructor_name: "Sarah Chen",
      enrolled_count: 3450,
    },
    created_at: "2025-01-01T00:00:00Z",
  },
  {
    id: "edu_seed_02",
    tenant_id: "tenant_seed",
    title: "Business Strategy & Leadership",
    description: "Learn strategic thinking, leadership skills, and business management from top MBA professors and industry executives.",
    short_description: "Strategic thinking and leadership essentials",
    category: "business",
    subcategory: "management",
    level: "intermediate",
    format: "hybrid",
    language: "English",
    currency_code: "USD",
    price: 29900,
    rating: 4.6,
    instructor_name: "Prof. Michael Torres",
    enrolled_count: 1890,
    status: "published",
    thumbnail: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&h=600&fit=crop",
    metadata: {
      thumbnail: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&h=600&fit=crop",
      images: ["https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&h=600&fit=crop"],
      price: 29900,
      rating: 4.6,
      instructor_name: "Prof. Michael Torres",
      enrolled_count: 1890,
    },
    created_at: "2025-01-05T00:00:00Z",
  },
  {
    id: "edu_seed_03",
    tenant_id: "tenant_seed",
    title: "Conversational Arabic for Beginners",
    description: "Start speaking Arabic from day one with our immersive, conversation-focused approach. Includes cultural context and real-world dialogues.",
    short_description: "Speak Arabic confidently from day one",
    category: "language",
    subcategory: "arabic",
    level: "beginner",
    format: "online",
    language: "English",
    currency_code: "USD",
    price: 14900,
    rating: 4.9,
    instructor_name: "Dr. Fatima Al-Rashid",
    enrolled_count: 2780,
    status: "published",
    thumbnail: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800&h=600&fit=crop",
    metadata: {
      thumbnail: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800&h=600&fit=crop",
      images: ["https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800&h=600&fit=crop"],
      price: 14900,
      rating: 4.9,
      instructor_name: "Dr. Fatima Al-Rashid",
      enrolled_count: 2780,
    },
    created_at: "2025-01-10T00:00:00Z",
  },
  {
    id: "edu_seed_04",
    tenant_id: "tenant_seed",
    title: "Digital Photography Masterclass",
    description: "From camera basics to advanced composition and post-processing. Learn to capture stunning photos in any environment.",
    short_description: "Capture stunning photos like a professional",
    category: "arts",
    subcategory: "photography",
    level: "intermediate",
    format: "in_person",
    language: "English",
    currency_code: "USD",
    price: 24900,
    rating: 4.7,
    instructor_name: "Alex Rivera",
    enrolled_count: 1560,
    status: "published",
    thumbnail: "https://images.unsplash.com/photo-1542038784456-1ea8e935640e?w=800&h=600&fit=crop",
    metadata: {
      thumbnail: "https://images.unsplash.com/photo-1542038784456-1ea8e935640e?w=800&h=600&fit=crop",
      images: ["https://images.unsplash.com/photo-1542038784456-1ea8e935640e?w=800&h=600&fit=crop"],
      price: 24900,
      rating: 4.7,
      instructor_name: "Alex Rivera",
      enrolled_count: 1560,
    },
    created_at: "2025-01-15T00:00:00Z",
  },
  {
    id: "edu_seed_05",
    tenant_id: "tenant_seed",
    title: "Data Science & Machine Learning",
    description: "Comprehensive course covering Python, statistics, machine learning algorithms, and deep learning. Includes hands-on projects with real datasets.",
    short_description: "Master data science and ML with Python",
    category: "science",
    subcategory: "data_science",
    level: "advanced",
    format: "online",
    language: "English",
    currency_code: "USD",
    price: 34900,
    rating: 4.9,
    instructor_name: "Dr. James Park",
    enrolled_count: 4120,
    status: "published",
    thumbnail: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=600&fit=crop",
    metadata: {
      thumbnail: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=600&fit=crop",
      images: ["https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=600&fit=crop"],
      price: 34900,
      rating: 4.9,
      instructor_name: "Dr. James Park",
      enrolled_count: 4120,
    },
    created_at: "2025-01-20T00:00:00Z",
  },
]

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const { id } = req.params

  try {
    const mod = req.scope.resolve("education") as any
    const item = await mod.retrieveCourse(id)
    if (item) return res.json({ item })
  } catch (error: any) {
    const isNotFound = error?.type === "not_found" || error?.message?.includes("not found")
    if (!isNotFound) {
      return handleApiError(res, error, "STORE-EDUCATION-ID")
    }
  }

  const seedMatch = SEED_DATA.find((c) => c.id === id) || SEED_DATA[0]
  return res.json({ item: seedMatch })
}
