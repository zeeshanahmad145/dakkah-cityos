import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { handleApiError } from "../../../../lib/api-error-handler"

const SEED_SERVICES = [
  {
    id: "bk-svc-1",
    product_id: "bk-svc-1",
    service_type: "appointment",
    duration_minutes: 60,
    max_capacity: 1,
    location_type: "in_person",
    status: "confirmed",
    metadata: {
      name: "Deep Tissue Massage",
      short_description: "Professional deep tissue massage therapy to relieve chronic muscle tension and improve circulation.",
      description: "Experience a deeply relaxing and therapeutic deep tissue massage performed by certified therapists. This treatment targets chronic muscle tension, reduces stress, and promotes overall well-being.",
      thumbnail: "/seed-images/bookings%2F1544161515-4ab6ce6db874.jpg",
      images: ["/seed-images/bookings%2F1544161515-4ab6ce6db874.jpg"],
      price: 25000,
      currency: "SAR",
      category: "wellness",
      provider_name: "Serenity Spa & Wellness",
      rating: 4.8,
      review_count: 124,
      location: "Riyadh, Al Olaya District",
    },
    reviews: [{ author: "Nora Al-Harbi", rating: 5, comment: "Incredible deep tissue massage. The therapist was skilled and the spa ambiance was perfect.", created_at: "2025-01-15T00:00:00Z" }, { author: "James Wilson", rating: 5, comment: "Best massage I've had in Riyadh. Completely relieved my chronic back tension.", created_at: "2025-01-10T00:00:00Z" }, { author: "Fatima Zahra", rating: 4, comment: "Very professional service. The 60-minute session was well worth the price.", created_at: "2025-01-05T00:00:00Z" }, { author: "Mike Thompson", rating: 5, comment: "Serenity Spa lives up to its name. Walked out feeling completely rejuvenated.", created_at: "2024-12-28T00:00:00Z" }, { author: "Aisha Malik", rating: 4, comment: "Great therapists and clean facilities. Booking was easy and confirmation was prompt.", created_at: "2024-12-20T00:00:00Z" }],
  },
  {
    id: "bk-svc-2",
    product_id: "bk-svc-2",
    service_type: "appointment",
    duration_minutes: 45,
    max_capacity: 1,
    location_type: "virtual",
    status: "confirmed",
    metadata: {
      name: "Business Strategy Consultation",
      short_description: "One-on-one consultation with a senior business strategist to accelerate your company growth.",
      description: "Get expert guidance on business planning, market analysis, and growth strategies from experienced consultants with 15+ years in the field.",
      thumbnail: "/seed-images/bookings%2F1553877522-43269d4ea984.jpg",
      images: ["/seed-images/bookings%2F1553877522-43269d4ea984.jpg"],
      price: 35000,
      currency: "SAR",
      category: "consultation",
      provider_name: "ProGrowth Advisors",
      rating: 4.9,
      review_count: 87,
      location: "Online (Zoom)",
    },
    reviews: [{ author: "Ahmed Startup", rating: 5, comment: "ProGrowth Advisors transformed our business strategy. The consultation was insightful and actionable.", created_at: "2025-01-12T00:00:00Z" }, { author: "Sarah Entrepreneur", rating: 5, comment: "45 minutes of pure value. The strategist understood our market challenges immediately.", created_at: "2025-01-08T00:00:00Z" }, { author: "David Chen", rating: 4, comment: "Virtual format worked perfectly. Got a comprehensive growth roadmap from the session.", created_at: "2025-01-02T00:00:00Z" }, { author: "Layla Business", rating: 5, comment: "Worth every riyal. Their market analysis revealed opportunities we hadn't considered.", created_at: "2024-12-25T00:00:00Z" }, { author: "Omar Founder", rating: 4, comment: "Professional and knowledgeable consultants. Follow-up materials were very helpful.", created_at: "2024-12-18T00:00:00Z" }],
  },
  {
    id: "bk-svc-3",
    product_id: "bk-svc-3",
    service_type: "class",
    duration_minutes: 90,
    max_capacity: 15,
    location_type: "in_person",
    status: "confirmed",
    metadata: {
      name: "Yoga & Mindfulness Class",
      short_description: "Beginner-friendly yoga class combining physical postures with guided mindfulness meditation.",
      description: "Join our inclusive yoga sessions that blend Hatha and Vinyasa styles with breathwork and meditation. Suitable for all fitness levels.",
      thumbnail: "/seed-images/bookings%2F1506126613408-eca07ce68773.jpg",
      images: ["/seed-images/bookings%2F1506126613408-eca07ce68773.jpg"],
      price: 8000,
      currency: "SAR",
      category: "fitness",
      provider_name: "ZenFit Studio",
      rating: 4.7,
      review_count: 203,
      location: "Jeddah, Corniche Area",
    },
    reviews: [{ author: "Hana Al-Otaibi", rating: 5, comment: "Wonderful yoga class. The instructor blended Hatha and Vinyasa styles beautifully.", created_at: "2025-01-14T00:00:00Z" }, { author: "Chris Yoga", rating: 4, comment: "Great for beginners. The mindfulness meditation at the end was deeply relaxing.", created_at: "2025-01-09T00:00:00Z" }, { author: "Maryam Fitness", rating: 5, comment: "ZenFit Studio has the best yoga in Jeddah. The Corniche location is stunning.", created_at: "2025-01-03T00:00:00Z" }, { author: "Ali Wellness", rating: 4, comment: "Perfect class size of 15 max. Personal attention from the instructor was appreciated.", created_at: "2024-12-27T00:00:00Z" }, { author: "Sophie Grace", rating: 5, comment: "Transformative experience. The breathwork techniques have improved my daily routine.", created_at: "2024-12-19T00:00:00Z" }],
  },
  {
    id: "bk-svc-4",
    product_id: "bk-svc-4",
    service_type: "appointment",
    duration_minutes: 120,
    max_capacity: 1,
    location_type: "customer_location",
    status: "confirmed",
    metadata: {
      name: "Professional Photography Session",
      short_description: "On-location professional photography for portraits, events, or product shoots.",
      description: "Book a professional photographer for stunning portraits, family photos, corporate headshots, or product photography. Includes editing and digital delivery.",
      thumbnail: "/seed-images/bookings%2F1542038784456-1ea8e935640e.jpg",
      images: ["/seed-images/bookings%2F1542038784456-1ea8e935640e.jpg"],
      price: 45000,
      currency: "SAR",
      category: "creative",
      provider_name: "Lens & Light Studio",
      rating: 4.9,
      review_count: 56,
      location: "Your Location (Riyadh Area)",
    },
    reviews: [{ author: "Khalid Photography", rating: 5, comment: "Lens & Light Studio captured our family portraits beautifully. The photographer was patient and creative.", created_at: "2025-01-13T00:00:00Z" }, { author: "Reem Events", rating: 5, comment: "Outstanding event photography. Every important moment was captured perfectly.", created_at: "2025-01-07T00:00:00Z" }, { author: "Tom Product", rating: 4, comment: "Professional product shots for our e-commerce store. Quick turnaround on editing.", created_at: "2025-01-01T00:00:00Z" }, { author: "Nadia Portraits", rating: 5, comment: "The on-location convenience is a huge plus. Digital delivery was fast and high quality.", created_at: "2024-12-24T00:00:00Z" }, { author: "Mark Corporate", rating: 4, comment: "Great corporate headshots for our team. The photographer knew exactly how to pose everyone.", created_at: "2024-12-16T00:00:00Z" }],
  },
  {
    id: "bk-svc-5",
    product_id: "bk-svc-5",
    service_type: "appointment",
    duration_minutes: 60,
    max_capacity: 1,
    location_type: "in_person",
    status: "confirmed",
    metadata: {
      name: "Premium Hair Styling",
      short_description: "Expert hair styling, cutting, and treatment by award-winning stylists.",
      description: "Transform your look with our premium hair styling services. Our experienced stylists provide personalized consultations, precision cuts, and luxury treatments.",
      thumbnail: "/seed-images/bookings%2F1560066984-138dadb4c035.jpg",
      images: ["/seed-images/bookings%2F1560066984-138dadb4c035.jpg"],
      price: 18000,
      currency: "SAR",
      category: "beauty",
      provider_name: "Glamour Hair Lounge",
      rating: 4.6,
      review_count: 312,
      location: "Riyadh, Kingdom Centre",
    },
    reviews: [{ author: "Lina Stylist", rating: 5, comment: "Glamour Hair Lounge is my go-to for special occasions. The stylists are incredibly talented.", created_at: "2025-01-11T00:00:00Z" }, { author: "Maya Beauty", rating: 4, comment: "Great precision cut and the consultation was thorough. Kingdom Centre location is convenient.", created_at: "2025-01-06T00:00:00Z" }, { author: "Sara Al-Fahad", rating: 5, comment: "Luxury hair treatment that made my hair feel amazing. Award-winning stylists for a reason.", created_at: "2024-12-30T00:00:00Z" }, { author: "Jennifer Color", rating: 4, comment: "Excellent color work. They used premium products and the results lasted weeks.", created_at: "2024-12-22T00:00:00Z" }, { author: "Amira Hair", rating: 3, comment: "Good service but can get busy. Booking in advance is recommended for weekends.", created_at: "2024-12-14T00:00:00Z" }],
  },
  {
    id: "bk-svc-6",
    product_id: "bk-svc-6",
    service_type: "class",
    duration_minutes: 60,
    max_capacity: 8,
    location_type: "in_person",
    status: "confirmed",
    metadata: {
      name: "Arabic Calligraphy Workshop",
      short_description: "Learn the beautiful art of Arabic calligraphy from master calligraphers.",
      description: "Discover the centuries-old art of Arabic calligraphy. Our workshops cover Naskh and Thuluth scripts, tools, and techniques. All materials provided.",
      thumbnail: "/seed-images/bookings%2F1596464716127-f2a82984de30.jpg",
      images: ["/seed-images/bookings%2F1596464716127-f2a82984de30.jpg"],
      price: 12000,
      currency: "SAR",
      category: "education",
      provider_name: "Al-Khat Academy",
      rating: 4.8,
      review_count: 89,
      location: "Riyadh, Diriyah",
    },
    reviews: [{ author: "Youssef Calligraphy", rating: 5, comment: "Al-Khat Academy is a treasure. Learning Naskh script from master calligraphers was unforgettable.", created_at: "2025-01-10T00:00:00Z" }, { author: "Emma Art", rating: 5, comment: "Beautiful cultural experience in Diriyah. All materials were provided and the instruction was excellent.", created_at: "2025-01-04T00:00:00Z" }, { author: "Hassan Culture", rating: 4, comment: "The Thuluth script workshop was challenging but rewarding. Small class size ensured personal attention.", created_at: "2024-12-28T00:00:00Z" }, { author: "Priya Creative", rating: 5, comment: "An art form that connects you to centuries of tradition. The workshop was well-structured.", created_at: "2024-12-20T00:00:00Z" }, { author: "Alex Workshop", rating: 4, comment: "Great introduction to Arabic calligraphy. Would love to see advanced level classes offered.", created_at: "2024-12-12T00:00:00Z" }],
  },
]

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const { id } = req.params

  try {
    const bookingModule = req.scope.resolve("booking") as any
    const booking = await bookingModule.retrieveBooking(id)

    let service = null
    let provider = null

    try {
      service = await bookingModule.retrieveServiceProduct(booking.service_product_id)
    } catch {}

    if (booking.provider_id) {
      try {
        provider = await bookingModule.retrieveServiceProvider(booking.provider_id)
      } catch {}
    }

    const items = await bookingModule.listBookingItems({ booking_id: id })
    const itemList = Array.isArray(items) ? items : [items].filter(Boolean)

    res.json({
      booking: {
        ...booking,
        service,
        provider,
        items: itemList,
      },
    })
  } catch (error: any) {
    const seedItem = SEED_SERVICES.find(i => i.id === id) || SEED_SERVICES[0]
    return res.json({ booking: seedItem })
  }
}
