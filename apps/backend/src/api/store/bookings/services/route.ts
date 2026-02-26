import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { handleApiError } from "../../../../lib/api-error-handler"
import { sanitizeList } from "../../../../lib/image-sanitizer"

const SEED_SERVICES = [
  {
    id: "bk-svc-1",
    product_id: "bk-svc-1",
    thumbnail: "/seed-images/bookings/1544161515-4ab6ce6db874.jpg",
    service_type: "appointment",
    duration_minutes: 60,
    max_capacity: 1,
    location_type: "in_person",
    metadata: {
      name: "Deep Tissue Massage",
      short_description: "Professional deep tissue massage therapy to relieve chronic muscle tension and improve circulation.",
      description: "Experience a deeply relaxing and therapeutic deep tissue massage performed by certified therapists. This treatment targets chronic muscle tension, reduces stress, and promotes overall well-being.",
      thumbnail: "/seed-images/bookings/1544161515-4ab6ce6db874.jpg",
      images: ["/seed-images/bookings/1544161515-4ab6ce6db874.jpg"],
      price: 25000,
      currency: "SAR",
      category: "wellness",
      provider_name: "Serenity Spa & Wellness",
      rating: 4.8,
      review_count: 124,
      location: "Riyadh, Al Olaya District",
    },
  },
  {
    id: "bk-svc-2",
    product_id: "bk-svc-2",
    thumbnail: "/seed-images/bookings/1553877522-43269d4ea984.jpg",
    service_type: "appointment",
    duration_minutes: 45,
    max_capacity: 1,
    location_type: "virtual",
    metadata: {
      name: "Business Strategy Consultation",
      short_description: "One-on-one consultation with a senior business strategist to accelerate your company growth.",
      description: "Get expert guidance on business planning, market analysis, and growth strategies from experienced consultants with 15+ years in the field.",
      thumbnail: "/seed-images/bookings/1553877522-43269d4ea984.jpg",
      images: ["/seed-images/bookings/1553877522-43269d4ea984.jpg"],
      price: 35000,
      currency: "SAR",
      category: "consultation",
      provider_name: "ProGrowth Advisors",
      rating: 4.9,
      review_count: 87,
      location: "Online (Zoom)",
    },
  },
  {
    id: "bk-svc-3",
    product_id: "bk-svc-3",
    thumbnail: "/seed-images/bookings/1506126613408-eca07ce68773.jpg",
    service_type: "class",
    duration_minutes: 90,
    max_capacity: 15,
    location_type: "in_person",
    metadata: {
      name: "Yoga & Mindfulness Class",
      short_description: "Beginner-friendly yoga class combining physical postures with guided mindfulness meditation.",
      description: "Join our inclusive yoga sessions that blend Hatha and Vinyasa styles with breathwork and meditation. Suitable for all fitness levels.",
      thumbnail: "/seed-images/bookings/1506126613408-eca07ce68773.jpg",
      images: ["/seed-images/bookings/1506126613408-eca07ce68773.jpg"],
      price: 8000,
      currency: "SAR",
      category: "fitness",
      provider_name: "ZenFit Studio",
      rating: 4.7,
      review_count: 203,
      location: "Jeddah, Corniche Area",
    },
  },
  {
    id: "bk-svc-4",
    product_id: "bk-svc-4",
    thumbnail: "/seed-images/bookings/1542038784456-1ea8e935640e.jpg",
    service_type: "appointment",
    duration_minutes: 120,
    max_capacity: 1,
    location_type: "customer_location",
    metadata: {
      name: "Professional Photography Session",
      short_description: "On-location professional photography for portraits, events, or product shoots.",
      description: "Book a professional photographer for stunning portraits, family photos, corporate headshots, or product photography. Includes editing and digital delivery.",
      thumbnail: "/seed-images/bookings/1542038784456-1ea8e935640e.jpg",
      images: ["/seed-images/bookings/1542038784456-1ea8e935640e.jpg"],
      price: 45000,
      currency: "SAR",
      category: "creative",
      provider_name: "Lens & Light Studio",
      rating: 4.9,
      review_count: 56,
      location: "Your Location (Riyadh Area)",
    },
  },
  {
    id: "bk-svc-5",
    product_id: "bk-svc-5",
    thumbnail: "/seed-images/bookings/1560066984-138dadb4c035.jpg",
    service_type: "appointment",
    duration_minutes: 60,
    max_capacity: 1,
    location_type: "in_person",
    metadata: {
      name: "Premium Hair Styling",
      short_description: "Expert hair styling, cutting, and treatment by award-winning stylists.",
      description: "Transform your look with our premium hair styling services. Our experienced stylists provide personalized consultations, precision cuts, and luxury treatments.",
      thumbnail: "/seed-images/bookings/1560066984-138dadb4c035.jpg",
      images: ["/seed-images/bookings/1560066984-138dadb4c035.jpg"],
      price: 18000,
      currency: "SAR",
      category: "beauty",
      provider_name: "Glamour Hair Lounge",
      rating: 4.6,
      review_count: 312,
      location: "Riyadh, Kingdom Centre",
    },
  },
  {
    id: "bk-svc-6",
    product_id: "bk-svc-6",
    thumbnail: "/seed-images/bookings/1596464716127-f2a82984de30.jpg",
    service_type: "class",
    duration_minutes: 60,
    max_capacity: 8,
    location_type: "in_person",
    metadata: {
      name: "Arabic Calligraphy Workshop",
      short_description: "Learn the beautiful art of Arabic calligraphy from master calligraphers.",
      description: "Discover the centuries-old art of Arabic calligraphy. Our workshops cover Naskh and Thuluth scripts, tools, and techniques. All materials provided.",
      thumbnail: "/seed-images/bookings/1596464716127-f2a82984de30.jpg",
      images: ["/seed-images/bookings/1596464716127-f2a82984de30.jpg"],
      price: 12000,
      currency: "SAR",
      category: "education",
      provider_name: "Al-Khat Academy",
      rating: 4.8,
      review_count: 89,
      location: "Riyadh, Diriyah",
    },
  },
]

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const bookingModule = req.scope.resolve("booking") as any
  
  const { 
    offset = 0, 
    limit = 50, 
    category,
    service_type,
  } = req.query
  
  try {
    let services: any[] = []
    try {
      const result = await bookingModule.listServiceProducts({}, {
        skip: Number(offset),
        take: Number(limit),
      })
      services = Array.isArray(result) ? result : [result].filter(Boolean)
    } catch {
      services = []
    }
    
    const sanitized = services.length > 0 ? sanitizeList(services, "bookings") : SEED_SERVICES
    const serviceList = sanitized.map((s: any) => ({
      ...s,
      thumbnail: s.thumbnail || s.metadata?.thumbnail || s.metadata?.images?.[0] || null,
    }))
    res.json({
      services: serviceList,
      count: serviceList.length,
      offset: Number(offset),
      limit: Number(limit),
    })
  } catch (error: any) {
    res.json({
      services: SEED_SERVICES,
      count: SEED_SERVICES.length,
      offset: Number(offset),
      limit: Number(limit),
    })
  }
}

