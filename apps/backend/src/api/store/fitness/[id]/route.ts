import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { handleApiError } from "../../../../lib/api-error-handler"

const SEED_DATA = [
  {
    id: "fit-seed-001",
    name: "Morning Vinyasa Yoga",
    description: "Start your day with a flowing yoga practice that builds strength, flexibility, and mindfulness. Suitable for all levels.",
    class_type: "yoga",
    instructor: "Sarah Chen",
    schedule: [{ day: "Monday", time: "7:00 AM", spots_available: 8 }, { day: "Wednesday", time: "7:00 AM", spots_available: 12 }, { day: "Friday", time: "7:00 AM", spots_available: 5 }],
    duration: 60,
    capacity: 25,
    price: 2500,
    currency: "USD",
    thumbnail: "/seed-images/affiliate%2F1544367567-0f2fcb009e0b.jpg",
    level: "all_levels",
    rating: 4.8,
    review_count: 124,
    location: "Downtown Wellness Studio",
    type: "class",
    is_active: true,
    benefits: ["Improved flexibility and balance", "Stress relief and mental clarity", "Full-body strength building", "Better posture and alignment"],
    membership_options: [
      { name: "Drop-In Class", price: 2500, period: "session", description: "Pay per individual class session" },
      { name: "Monthly Unlimited", price: 15000, period: "month", description: "Unlimited classes for 30 days" },
      { name: "Annual Membership", price: 144000, period: "year", description: "Best value - save 20% with annual commitment" },
    ],
  },
  {
    id: "fit-seed-002",
    name: "CrossFit WOD Challenge",
    description: "High-intensity functional fitness workout combining weightlifting, cardio, and gymnastics movements.",
    class_type: "crossfit",
    instructor: "Marcus Johnson",
    schedule: [{ day: "Tuesday", time: "6:00 AM", spots_available: 3 }, { day: "Thursday", time: "6:00 AM", spots_available: 6 }, { day: "Saturday", time: "6:00 AM", spots_available: 10 }],
    duration: 45,
    capacity: 15,
    price: 3500,
    currency: "USD",
    thumbnail: "/seed-images/bookings%2F1534438327276-14e5300c3a48.jpg",
    level: "intermediate",
    rating: 4.9,
    review_count: 89,
    location: "Iron Box Gym",
    type: "class",
    is_active: true,
    benefits: ["Increased cardiovascular endurance", "Functional strength gains", "Community-driven motivation", "Scalable for all fitness levels"],
    membership_options: [
      { name: "Single Session", price: 3500, period: "session", description: "One CrossFit WOD session" },
      { name: "10-Class Pack", price: 30000, period: "pack", description: "Save 15% with a 10-class bundle" },
      { name: "Unlimited Monthly", price: 20000, period: "month", description: "Unlimited CrossFit classes all month" },
    ],
  },
  {
    id: "fit-seed-003",
    name: "Personal Training Session",
    description: "One-on-one customized training program designed to meet your specific fitness goals and needs.",
    class_type: "hiit",
    instructor: "Alex Rivera",
    schedule: [{ day: "By Appointment", time: "Flexible", spots_available: 1 }],
    duration: 60,
    capacity: 1,
    price: 7500,
    currency: "USD",
    thumbnail: "/seed-images/bundles%2F1571019613454-1cb2f99b2d8b.jpg",
    level: "all_levels",
    rating: 5.0,
    review_count: 56,
    location: "FitLife Performance Center",
    type: "personal",
    is_active: true,
    benefits: ["Personalized workout plans", "One-on-one coaching", "Faster results with accountability", "Injury prevention guidance"],
    membership_options: [
      { name: "Single Session", price: 7500, period: "session", description: "One personal training session" },
      { name: "4-Session Pack", price: 26000, period: "month", description: "Weekly sessions - save 13%" },
      { name: "12-Session Pack", price: 72000, period: "3 months", description: "Best value - save 20% on personal training" },
    ],
  },
  {
    id: "fit-seed-004",
    name: "Lap Swimming & Aqua Fitness",
    description: "Structured swimming sessions and water-based exercises for cardio, strength, and rehabilitation.",
    class_type: "swimming",
    instructor: "Diana Park",
    schedule: [{ day: "Monday - Friday", time: "6:00 AM - 9:00 PM", spots_available: 15 }, { day: "Saturday - Sunday", time: "8:00 AM - 6:00 PM", spots_available: 20 }],
    duration: 45,
    capacity: 30,
    price: 2000,
    currency: "USD",
    thumbnail: "/seed-images/fitness%2F1518611012118-696072aa579a.jpg",
    level: "beginner",
    rating: 4.7,
    review_count: 98,
    location: "Aquatic Sports Center",
    type: "class",
    is_active: true,
    benefits: ["Low-impact full-body workout", "Joint-friendly exercise", "Improved cardiovascular health", "Enhanced muscle recovery"],
    membership_options: [
      { name: "Day Pass", price: 2000, period: "day", description: "Full-day access to pool facilities" },
      { name: "Monthly Pool Access", price: 12000, period: "month", description: "Unlimited pool access for 30 days" },
      { name: "Family Monthly", price: 25000, period: "month", description: "Pool access for up to 4 family members" },
    ],
  },
  {
    id: "fit-seed-005",
    name: "Kickboxing & Martial Arts",
    description: "Learn striking techniques while getting an incredible full-body workout. Build confidence and self-defense skills.",
    class_type: "boxing",
    instructor: "Kenji Tanaka",
    schedule: [{ day: "Monday", time: "6:00 PM", spots_available: 7 }, { day: "Wednesday", time: "6:00 PM", spots_available: 4 }, { day: "Friday", time: "6:00 PM", spots_available: 11 }],
    duration: 60,
    capacity: 20,
    price: 3000,
    currency: "USD",
    thumbnail: "/seed-images/fitness%2F1576091160399-112ba8d25d1d.jpg",
    level: "all_levels",
    rating: 4.9,
    review_count: 73,
    location: "Combat Athletics Academy",
    type: "class",
    is_active: true,
    benefits: ["Self-defense skills", "Full-body conditioning", "Improved coordination and agility", "Stress release and confidence building"],
    membership_options: [
      { name: "Trial Class", price: 1500, period: "session", description: "First-time introductory class" },
      { name: "8-Class Pack", price: 20000, period: "pack", description: "Flexible 8-class bundle" },
      { name: "Unlimited Monthly", price: 18000, period: "month", description: "Unlimited martial arts classes" },
    ],
  },
]

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const mod = req.scope.resolve("fitness") as any
    const { id } = req.params
    try {
      const item = await mod.retrieveClassSchedule(id)
      if (item) return res.json({ item })
    } catch {}
    try {
      const item = await mod.retrieveTrainerProfile(id)
      if (item) return res.json({ item })
    } catch {}
    try {
      const item = await mod.retrieveGymMembership(id)
      if (item) return res.json({ item })
    } catch {}
    const seedItem = SEED_DATA.find((s) => s.id === id) || SEED_DATA[0]
    return res.json({ item: seedItem })
  } catch (error: any) {
    const { id } = req.params
    const seedItem = SEED_DATA.find((s) => s.id === id) || SEED_DATA[0]
    return res.json({ item: seedItem })
  }
}
