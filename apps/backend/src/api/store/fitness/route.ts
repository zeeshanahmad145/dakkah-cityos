import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { handleApiError } from "../../../lib/api-error-handler"

const SEED_CLASSES = [
  {
    id: "fit-seed-001",
    name: "Morning Vinyasa Yoga",
    description: "Start your day with a flowing yoga practice that builds strength, flexibility, and mindfulness.",
    class_type: "yoga",
    instructor: "Sarah Chen",
    schedule: "Mon, Wed, Fri 7:00 AM",
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
  },
  {
    id: "fit-seed-002",
    name: "CrossFit WOD Challenge",
    description: "High-intensity functional fitness workout combining weightlifting, cardio, and gymnastics movements.",
    class_type: "crossfit",
    instructor: "Marcus Johnson",
    schedule: "Tue, Thu, Sat 6:00 AM",
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
  },
  {
    id: "fit-seed-003",
    name: "Personal Training Session",
    description: "One-on-one customized training program designed to meet your specific fitness goals.",
    class_type: "hiit",
    instructor: "Alex Rivera",
    schedule: "By Appointment",
    duration: 60,
    capacity: 1,
    price: 7500,
    currency: "USD",
    thumbnail: "/seed-images/fitness%2F1571019614242-c5c5dee9f50b.jpg",
    level: "all_levels",
    rating: 5.0,
    review_count: 56,
    location: "FitLife Performance Center",
    type: "personal",
    is_active: true,
  },
  {
    id: "fit-seed-004",
    name: "Lap Swimming & Aqua Fitness",
    description: "Structured swimming sessions and water-based exercises for cardio, strength, and rehabilitation.",
    class_type: "swimming",
    instructor: "Diana Park",
    schedule: "Daily 6:00 AM - 9:00 PM",
    duration: 45,
    capacity: 30,
    price: 2000,
    currency: "USD",
    thumbnail: "/seed-images/fitness%2F1530549387789-4c1017266635.jpg",
    level: "beginner",
    rating: 4.7,
    review_count: 98,
    location: "Aquatic Sports Center",
    type: "class",
    is_active: true,
  },
  {
    id: "fit-seed-005",
    name: "Kickboxing & Martial Arts",
    description: "Learn striking techniques while getting an incredible full-body workout.",
    class_type: "boxing",
    instructor: "Kenji Tanaka",
    schedule: "Mon, Wed, Fri 6:00 PM",
    duration: 60,
    capacity: 20,
    price: 3000,
    currency: "USD",
    thumbnail: "/seed-images/fitness%2F1549719386-74dfcbf7dbed.jpg",
    level: "all_levels",
    rating: 4.9,
    review_count: 73,
    location: "Combat Athletics Academy",
    type: "class",
    is_active: true,
  },
]

const SEED_TRAINERS = [
  {
    id: "trainer-seed-001",
    name: "Sarah Chen",
    specialization: "Yoga & Pilates",
    thumbnail: "/seed-images/fitness%2F1518611012118-696072aa579a.jpg",
    rating: 4.8,
  },
  {
    id: "trainer-seed-002",
    name: "Marcus Johnson",
    specialization: "CrossFit & Strength",
    thumbnail: "/seed-images/fitness%2F1571019613454-1cb2f99b2d8b.jpg",
    rating: 4.9,
  },
]

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const fitnessService = req.scope.resolve("fitness") as any
    const {
      limit = "20",
      offset = "0",
      tenant_id,
      type,
      level,
      class_type,
      is_active,
      search,
    } = req.query as Record<string, string | undefined>

    const filters: Record<string, any> = {}
    if (tenant_id) filters.tenant_id = tenant_id
    if (type) filters.type = type
    if (level) filters.level = level
    if (class_type) filters.class_type = class_type
    if (is_active !== undefined) filters.is_active = is_active === "true"
    if (search) filters.name = { $like: `%${search}%` }

    const paginationOpts = {
      skip: Number(offset),
      take: Number(limit),
      order: { created_at: "DESC" },
    }

    const [classes, trainers] = await Promise.all([
      fitnessService.listClassSchedules(filters, paginationOpts),
      fitnessService.listTrainerProfiles(filters, paginationOpts),
    ])

    const classList = Array.isArray(classes) && classes.length > 0 ? classes : SEED_CLASSES
    const trainerList = Array.isArray(trainers) && trainers.length > 0 ? trainers : SEED_TRAINERS

    return res.json({
      classes: classList,
      items: classList,
      trainers: trainerList,
      count: classList.length + trainerList.length,
      limit: Number(limit),
      offset: Number(offset),
    })
  } catch (error: any) {
    return res.json({
      classes: SEED_CLASSES,
      items: SEED_CLASSES,
      trainers: SEED_TRAINERS,
      count: SEED_CLASSES.length + SEED_TRAINERS.length,
      limit: 20,
      offset: 0,
    })
  }
}

