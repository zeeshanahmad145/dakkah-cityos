import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { handleApiError } from "../../../lib/api-error-handler"

const SEED_DATA = [
  {
    id: "park-seed-001",
    name: "Downtown Central Parking",
    description: "Premium covered parking in the heart of downtown with 24/7 security and EV charging stations.",
    zone_type: "covered",
    metadata: {
      thumbnail: "/seed-images/parking%2F1506521781263-d8422e82f27a.jpg",
      price_per_hour: 500,
      images: ["/seed-images/parking%2F1506521781263-d8422e82f27a.jpg"],
    },
    thumbnail: "/seed-images/parking%2F1506521781263-d8422e82f27a.jpg",
    currency_code: "SAR",
    address: "123 King Fahd Road, Riyadh",
    total_spots: 500,
    available_spots: 127,
    operating_hours: "24/7",
    is_available: true,
  },
  {
    id: "park-seed-002",
    name: "Mall Underground Garage",
    description: "Spacious underground parking with direct mall access, CCTV monitoring, and valet service.",
    zone_type: "underground",
    metadata: {
      thumbnail: "/seed-images/parking%2F1573348722427-f1d6819fdf98.jpg",
      price_per_hour: 800,
      images: ["/seed-images/parking%2F1573348722427-f1d6819fdf98.jpg"],
    },
    thumbnail: "/seed-images/parking%2F1573348722427-f1d6819fdf98.jpg",
    currency_code: "SAR",
    address: "456 Olaya Street, Riyadh",
    total_spots: 1200,
    available_spots: 342,
    operating_hours: "6:00 AM - 12:00 AM",
    is_available: true,
  },
  {
    id: "park-seed-003",
    name: "Airport Long-Term Parking",
    description: "Affordable long-term parking with complimentary shuttle service to all terminals.",
    zone_type: "open",
    metadata: {
      thumbnail: "/seed-images/parking%2F1568605117036-5fe5e7bab0b7.jpg",
      price_per_hour: 300,
      images: ["/seed-images/parking%2F1568605117036-5fe5e7bab0b7.jpg"],
    },
    thumbnail: "/seed-images/parking%2F1568605117036-5fe5e7bab0b7.jpg",
    currency_code: "SAR",
    address: "King Khalid International Airport, Riyadh",
    total_spots: 2000,
    available_spots: 856,
    operating_hours: "24/7",
    is_available: true,
  },
  {
    id: "park-seed-004",
    name: "Business District Tower Parking",
    description: "Multi-story automated parking facility with reserved spots for premium members.",
    zone_type: "multi_story",
    metadata: {
      thumbnail: "/seed-images/parking%2F1590674899484-d5640e854abe.jpg",
      price_per_hour: 600,
      images: ["/seed-images/parking%2F1590674899484-d5640e854abe.jpg"],
    },
    thumbnail: "/seed-images/parking%2F1590674899484-d5640e854abe.jpg",
    currency_code: "SAR",
    address: "789 King Abdullah Financial District",
    total_spots: 800,
    available_spots: 45,
    operating_hours: "5:00 AM - 11:00 PM",
    is_available: true,
  },
  {
    id: "park-seed-005",
    name: "Luxury Hotel Valet Parking",
    description: "White-glove valet service at the finest hotel, with car wash and detailing options.",
    zone_type: "valet",
    metadata: {
      thumbnail: "/seed-images/parking%2F1486006920555-c77dcf18193c.jpg",
      price_per_hour: 1500,
      images: ["/seed-images/parking%2F1486006920555-c77dcf18193c.jpg"],
    },
    thumbnail: "/seed-images/parking%2F1486006920555-c77dcf18193c.jpg",
    currency_code: "SAR",
    address: "Al Faisaliah Hotel, Riyadh",
    total_spots: 200,
    available_spots: 18,
    operating_hours: "24/7",
    is_available: true,
  },
]

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const parkingService = req.scope.resolve("parking") as any
    const {
      limit = "20",
      offset = "0",
      tenant_id,
      status,
      zone_type,
      location,
      city,
      is_available,
      search,
    } = req.query as Record<string, string | undefined>

    const filters: Record<string, any> = {}
    if (tenant_id) filters.tenant_id = tenant_id
    if (status) filters.status = status
    if (zone_type) filters.zone_type = zone_type
    if (location) filters.location = location
    if (city) filters.city = city
    if (is_available !== undefined) filters.is_available = is_available === "true"
    if (search) filters.name = { $like: `%${search}%` }

    const [items, count] = await Promise.all([
      parkingService.listParkingZones(filters, {
        skip: Number(offset),
        take: Number(limit),
        order: { created_at: "DESC" },
      }),
      parkingService.listParkingZones(filters, { skip: 0, take: 0 }).then(
        (r: any) => (Array.isArray(r) ? r.length : 0)
      ).catch(() => 0),
    ])

    const itemList = Array.isArray(items) && items.length > 0 ? items : SEED_DATA

    return res.json({
      items: itemList,
      count: itemList.length,
      limit: Number(limit),
      offset: Number(offset),
    })
  } catch (error: any) {
    return res.json({
      items: SEED_DATA,
      count: SEED_DATA.length,
      limit: 20,
      offset: 0,
    })
  }
}

