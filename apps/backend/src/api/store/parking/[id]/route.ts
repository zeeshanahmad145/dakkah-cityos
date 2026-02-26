import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { handleApiError } from "../../../../lib/api-error-handler"

const SEED_DATA = [
  {
    id: "park-seed-001",
    name: "Downtown Central Parking",
    description: "Premium covered parking in the heart of downtown with 24/7 security and EV charging stations.",
    zone_type: "covered",
    metadata: {
      thumbnail: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&h=600&fit=crop",
      price_per_hour: 500,
      images: ["https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&h=600&fit=crop"],
    },
    thumbnail: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&h=600&fit=crop",
    currency_code: "SAR",
    address: "123 King Fahd Road, Riyadh",
    total_spots: 500,
    available_spots: 127,
    operating_hours: "24/7",
    is_available: true,
    features: ["EV charging stations", "24/7 security cameras", "Covered parking", "Wheelchair accessible"],
  },
  {
    id: "park-seed-002",
    name: "Mall Underground Garage",
    description: "Spacious underground parking with direct mall access, CCTV monitoring, and valet service available.",
    zone_type: "underground",
    metadata: {
      thumbnail: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=800&h=600&fit=crop",
      price_per_hour: 800,
      images: ["https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=800&h=600&fit=crop"],
    },
    thumbnail: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=800&h=600&fit=crop",
    currency_code: "SAR",
    address: "456 Olaya Street, Riyadh",
    total_spots: 1200,
    available_spots: 342,
    operating_hours: "6:00 AM - 12:00 AM",
    is_available: true,
    features: ["Direct mall access", "CCTV monitoring", "Valet service available", "Family parking zones"],
  },
  {
    id: "park-seed-003",
    name: "Airport Long-Term Parking",
    description: "Affordable long-term parking with complimentary shuttle service to all terminals.",
    zone_type: "open",
    metadata: {
      thumbnail: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&h=600&fit=crop",
      price_per_hour: 300,
      images: ["https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&h=600&fit=crop"],
    },
    thumbnail: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&h=600&fit=crop",
    currency_code: "SAR",
    address: "King Khalid International Airport, Riyadh",
    total_spots: 2000,
    available_spots: 856,
    operating_hours: "24/7",
    is_available: true,
    features: ["Free shuttle service", "Long-term discounts", "Well-lit grounds", "Luggage assistance"],
  },
  {
    id: "park-seed-004",
    name: "Business District Tower Parking",
    description: "Multi-story automated parking facility with reserved spots for premium members.",
    zone_type: "multi_story",
    metadata: {
      thumbnail: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&h=600&fit=crop",
      price_per_hour: 600,
      images: ["https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&h=600&fit=crop"],
    },
    thumbnail: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&h=600&fit=crop",
    currency_code: "SAR",
    address: "789 King Abdullah Financial District",
    total_spots: 800,
    available_spots: 45,
    operating_hours: "5:00 AM - 11:00 PM",
    is_available: true,
    features: ["Automated parking system", "Reserved premium spots", "Monthly subscriptions", "Mobile app access"],
  },
  {
    id: "park-seed-005",
    name: "Luxury Hotel Valet Parking",
    description: "White-glove valet service at the finest hotel, with car wash and detailing options.",
    zone_type: "valet",
    metadata: {
      thumbnail: "https://images.unsplash.com/photo-1489824904134-891ab64532f1?w=800&h=600&fit=crop",
      price_per_hour: 1500,
      images: ["https://images.unsplash.com/photo-1489824904134-891ab64532f1?w=800&h=600&fit=crop"],
    },
    thumbnail: "https://images.unsplash.com/photo-1489824904134-891ab64532f1?w=800&h=600&fit=crop",
    currency_code: "SAR",
    address: "Al Faisaliah Hotel, Riyadh",
    total_spots: 200,
    available_spots: 18,
    operating_hours: "24/7",
    is_available: true,
    features: ["White-glove valet service", "Car wash & detailing", "Climate-controlled garage", "VIP lounge access"],
  },
]

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const mod = req.scope.resolve("parking") as any
    const { id } = req.params
    const item = await mod.retrieveParkingZone(id)
    if (item) return res.json({ item })
    const seedItem = SEED_DATA.find((s) => s.id === id) || SEED_DATA[0]
    return res.json({ item: seedItem })
  } catch (error: any) {
    const { id } = req.params
    const seedItem = SEED_DATA.find((s) => s.id === id) || SEED_DATA[0]
    return res.json({ item: seedItem })
  }
}
