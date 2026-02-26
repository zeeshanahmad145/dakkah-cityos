import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { handleApiError } from "../../../lib/api-error-handler"

const EVENTS_SEED = [
  {
    id: "evt_001",
    name: "Riyadh Season Festival 2026",
    handle: "riyadh-season-2026",
    description: "The largest entertainment festival in the Middle East featuring world-class performances, exhibitions, and culinary experiences.",
    event_type: "Festival",
    venue: "Boulevard Riyadh City",
    city: "Riyadh",
    country_code: "SA",
    start_date: "2026-10-15",
    end_date: "2027-03-15",
    price: 50,
    currency: "SAR",
    rating: 4.8,
    total_reviews: 12500,
    capacity: 50000,
    is_active: true,
    organizer: "General Entertainment Authority",
    tags: ["entertainment", "music", "food", "culture"],
    image_url: "/seed-images/events/1540575467063-178a50c2df87.jpg",
    thumbnail: "/seed-images/events/1540575467063-178a50c2df87.jpg",
  },
  {
    id: "evt_002",
    name: "LEAP Technology Conference",
    handle: "leap-tech-2026",
    description: "Global technology conference bringing together innovators, investors, and enterprise leaders from around the world.",
    event_type: "Conference",
    venue: "Riyadh Front Exhibition Center",
    city: "Riyadh",
    country_code: "SA",
    start_date: "2026-02-09",
    end_date: "2026-02-12",
    price: 200,
    currency: "SAR",
    rating: 4.7,
    total_reviews: 8900,
    capacity: 100000,
    is_active: true,
    organizer: "Ministry of Communications and IT",
    tags: ["technology", "innovation", "startup", "ai"],
    image_url: "/seed-images/events/1505373877841-8d25f7d46678.jpg",
    thumbnail: "/seed-images/events/1505373877841-8d25f7d46678.jpg",
  },
  {
    id: "evt_003",
    name: "Jeddah Jazz Festival",
    handle: "jeddah-jazz-2026",
    description: "An unforgettable evening of jazz music featuring international and local artists along the Jeddah Corniche.",
    event_type: "Concert",
    venue: "Jeddah Superdome",
    city: "Jeddah",
    country_code: "SA",
    start_date: "2026-04-20",
    end_date: "2026-04-22",
    price: 150,
    currency: "SAR",
    rating: 4.5,
    total_reviews: 3200,
    capacity: 15000,
    is_active: true,
    organizer: "Jeddah Entertainment Co.",
    tags: ["music", "jazz", "live", "concert"],
    image_url: "/seed-images/events/1514525253161-7a46d19cd819.jpg",
    thumbnail: "/seed-images/events/1514525253161-7a46d19cd819.jpg",
  },
  {
    id: "evt_004",
    name: "Saudi Food Festival",
    handle: "saudi-food-festival",
    description: "Celebrate Saudi culinary heritage with live cooking demonstrations, food stalls, and workshops featuring traditional and modern cuisine.",
    event_type: "Food Festival",
    venue: "King Abdullah Financial District",
    city: "Riyadh",
    country_code: "SA",
    start_date: "2026-05-01",
    end_date: "2026-05-07",
    price: 75,
    currency: "SAR",
    rating: 4.6,
    total_reviews: 5600,
    capacity: 20000,
    is_active: true,
    organizer: "Saudi Culinary Association",
    tags: ["food", "cooking", "culture", "family"],
    image_url: "/seed-images/events/1555939594-58d7cb561ad1.jpg",
    thumbnail: "/seed-images/events/1555939594-58d7cb561ad1.jpg",
  },
  {
    id: "evt_005",
    name: "AlUla Arts Festival",
    handle: "alula-arts-2026",
    description: "Immersive art installations and cultural exhibitions set against the stunning backdrop of AlUla's ancient landscapes.",
    event_type: "Art Exhibition",
    venue: "AlUla Heritage Site",
    city: "AlUla",
    country_code: "SA",
    start_date: "2026-11-01",
    end_date: "2026-12-15",
    price: 120,
    currency: "SAR",
    rating: 4.9,
    total_reviews: 7800,
    capacity: 10000,
    is_active: true,
    organizer: "Royal Commission for AlUla",
    tags: ["art", "culture", "heritage", "exhibition"],
    image_url: "/seed-images/events/1501281668745-f7f57925c3b4.jpg",
    thumbnail: "/seed-images/events/1501281668745-f7f57925c3b4.jpg",
  },
  {
    id: "evt_006",
    name: "Dakar Rally Saudi Arabia",
    handle: "dakar-rally-2026",
    description: "The world's most grueling off-road rally race traversing Saudi Arabia's diverse desert terrain.",
    event_type: "Sports",
    venue: "Multiple Locations",
    city: "Jeddah",
    country_code: "SA",
    start_date: "2026-01-03",
    end_date: "2026-01-17",
    price: 0,
    currency: "SAR",
    rating: 4.8,
    total_reviews: 15000,
    capacity: 200000,
    is_active: true,
    organizer: "Saudi Motorsport Company",
    tags: ["sports", "racing", "adventure", "motorsport"],
    image_url: "/seed-images/events/1568605117036-5fe5e7bab0b7.jpg",
    thumbnail: "/seed-images/events/1568605117036-5fe5e7bab0b7.jpg",
  },
  {
    id: "evt_007",
    name: "Saudi Arabian Grand Prix",
    handle: "f1-jeddah-2026",
    description: "Formula 1 racing at the spectacular Jeddah Corniche Circuit under the lights.",
    event_type: "Sports",
    venue: "Jeddah Corniche Circuit",
    city: "Jeddah",
    country_code: "SA",
    start_date: "2026-03-20",
    end_date: "2026-03-22",
    price: 500,
    currency: "SAR",
    rating: 4.9,
    total_reviews: 25000,
    capacity: 90000,
    is_active: true,
    organizer: "Saudi Motorsport Company",
    tags: ["f1", "racing", "sports", "motorsport"],
    image_url: "/seed-images/events/1511578314322-379afb476865.jpg",
    thumbnail: "/seed-images/events/1511578314322-379afb476865.jpg",
  },
  {
    id: "evt_008",
    name: "Soundstorm Music Festival",
    handle: "soundstorm-2026",
    description: "The Middle East's biggest music festival featuring global DJ headliners and electronic music acts.",
    event_type: "Music Festival",
    venue: "Banban",
    city: "Riyadh",
    country_code: "SA",
    start_date: "2026-12-01",
    end_date: "2026-12-04",
    price: 350,
    currency: "SAR",
    rating: 4.7,
    total_reviews: 18000,
    capacity: 200000,
    is_active: true,
    organizer: "MDLBEAST",
    tags: ["music", "edm", "festival", "entertainment"],
    image_url: "/seed-images/events/1459749411175-04bf5292ceea.jpg",
  },
]

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const { limit = "20", offset = "0", event_type, search } = req.query as Record<string, string | undefined>

    let items = [...EVENTS_SEED]

    if (event_type) {
      items = items.filter(e => e.event_type.toLowerCase() === event_type.toLowerCase())
    }
    if (search) {
      const q = search.toLowerCase()
      items = items.filter(e =>
        e.name.toLowerCase().includes(q) ||
        e.description.toLowerCase().includes(q) ||
        e.city.toLowerCase().includes(q)
      )
    }

    const start = Number(offset)
    const end = start + Number(limit)
    const paged = items.slice(start, end).map(e => ({ ...e, thumbnail: e.thumbnail || e.image_url }))

    res.json({ items: paged, count: items.length, limit: Number(limit), offset: start })
  } catch (error: any) {
    return handleApiError(res, error, "STORE-EVENTS")
  }
}
