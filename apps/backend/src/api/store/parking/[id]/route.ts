import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { handleApiError } from "../../../../lib/api-error-handler";
import { enrichDetailItem } from "../../../../lib/detail-enricher";

const SEED_DATA = [
  {
    id: "park-seed-001",
    name: "Downtown Central Parking",
    description:
      "Premium covered parking in the heart of downtown with 24/7 security and EV charging stations.",
    zone_type: "covered",
    metadata: {
      thumbnail: "/seed-images/parking/1497366216548-37526070297c.jpg",
      price_per_hour: 500,
      images: ["/seed-images/parking/1497366216548-37526070297c.jpg"],
    },
    thumbnail: "/seed-images/parking/1497366216548-37526070297c.jpg",
    currency_code: "SAR",
    address: "123 King Fahd Road, Riyadh",
    total_spots: 500,
    available_spots: 127,
    operating_hours: "24/7",
    is_available: true,
    features: [
      "EV charging stations",
      "24/7 security cameras",
      "Covered parking",
      "Wheelchair accessible",
    ],
    rates: [
      { label: "Hourly", price: 5.0, name: "Hourly Rate" },
      { label: "Daily Max", price: 40.0, name: "Daily Maximum" },
      { label: "Monthly Pass", price: 600.0, name: "Monthly Subscription" },
      { label: "Weekend Rate", price: 3.0, name: "Weekend Hourly" },
    ],
    rules: [
      "No overnight parking without monthly pass",
      "Speed limit 10 km/h",
      "No vehicle washing on premises",
      "Motorcycles use designated spots only",
    ],
    reviews: [
      {
        author: "Khalid A.",
        rating: 5,
        comment:
          "Best parking in downtown. EV charging is a huge plus and security is top-notch.",
        created_at: "2025-01-05T09:00:00Z",
      },
      {
        author: "Sara M.",
        rating: 4,
        comment:
          "Clean, well-lit, and always feels safe. Rates are fair for the location.",
        created_at: "2025-01-15T14:00:00Z",
      },
      {
        author: "Omar T.",
        rating: 4,
        comment:
          "Convenient 24/7 access. The monthly pass is great value for daily commuters.",
        created_at: "2025-01-25T11:00:00Z",
      },
      {
        author: "Fatima H.",
        rating: 5,
        comment:
          "Wheelchair accessible spots are well-placed. Really appreciate the inclusivity.",
        created_at: "2025-02-05T08:00:00Z",
      },
      {
        author: "Yousef K.",
        rating: 3,
        comment:
          "Good parking but can get crowded during peak hours. Arrive early.",
        created_at: "2025-02-15T16:00:00Z",
      },
    ],
  },
  {
    id: "park-seed-002",
    name: "Mall Underground Garage",
    description:
      "Spacious underground parking with direct mall access, CCTV monitoring, and valet service available.",
    zone_type: "underground",
    metadata: {
      thumbnail: "/seed-images/government/1559839734-2b71ea197ec2.jpg",
      price_per_hour: 800,
      images: ["/seed-images/government/1559839734-2b71ea197ec2.jpg"],
    },
    thumbnail: "/seed-images/government/1559839734-2b71ea197ec2.jpg",
    currency_code: "SAR",
    address: "456 Olaya Street, Riyadh",
    total_spots: 1200,
    available_spots: 342,
    operating_hours: "6:00 AM - 12:00 AM",
    is_available: true,
    features: [
      "Direct mall access",
      "CCTV monitoring",
      "Valet service available",
      "Family parking zones",
    ],
    rates: [
      { label: "Hourly", price: 8.0, name: "Hourly Rate" },
      { label: "Daily Max", price: 60.0, name: "Daily Maximum" },
      { label: "Valet", price: 25.0, name: "Valet Service" },
    ],
    rules: [
      "Maximum vehicle height 2.1m",
      "No idling in parking areas",
      "Follow directional arrows",
      "Report accidents to security immediately",
    ],
    reviews: [
      {
        author: "Layla S.",
        rating: 5,
        comment:
          "Direct mall access is so convenient. Never have to walk in the heat!",
        created_at: "2025-01-08T10:00:00Z",
      },
      {
        author: "Ahmed R.",
        rating: 4,
        comment:
          "Valet service is excellent. Car always ready when I finish shopping.",
        created_at: "2025-01-18T13:00:00Z",
      },
      {
        author: "Reem W.",
        rating: 4,
        comment:
          "Family parking zones are spacious and well-located near the elevators.",
        created_at: "2025-01-28T09:30:00Z",
      },
      {
        author: "Badr N.",
        rating: 3,
        comment:
          "Good garage but daily max rate is a bit steep compared to alternatives.",
        created_at: "2025-02-07T15:00:00Z",
      },
      {
        author: "Nadia F.",
        rating: 5,
        comment:
          "CCTV everywhere makes me feel secure. Best mall parking experience.",
        created_at: "2025-02-17T11:00:00Z",
      },
    ],
  },
  {
    id: "park-seed-003",
    name: "Airport Long-Term Parking",
    description:
      "Affordable long-term parking with complimentary shuttle service to all terminals.",
    zone_type: "open",
    metadata: {
      thumbnail: "/seed-images/government/1564013799919-ab600027ffc6.jpg",
      price_per_hour: 300,
      images: ["/seed-images/government/1564013799919-ab600027ffc6.jpg"],
    },
    thumbnail: "/seed-images/government/1564013799919-ab600027ffc6.jpg",
    currency_code: "SAR",
    address: "King Khalid International Airport, Riyadh",
    total_spots: 2000,
    available_spots: 856,
    operating_hours: "24/7",
    is_available: true,
    features: [
      "Free shuttle service",
      "Long-term discounts",
      "Well-lit grounds",
      "Luggage assistance",
    ],
    rates: [
      { label: "Hourly", price: 3.0, name: "Hourly Rate" },
      { label: "Daily", price: 25.0, name: "Daily Rate" },
      { label: "Weekly", price: 120.0, name: "Weekly Rate" },
      { label: "Monthly", price: 400.0, name: "Monthly Rate" },
    ],
    rules: [
      "Leave keys in vehicle if using valet",
      "Maximum stay 60 days",
      "No vehicle maintenance in lot",
      "Shuttle runs every 15 minutes",
    ],
    reviews: [
      {
        author: "Mansour D.",
        rating: 5,
        comment:
          "Used it for a 2-week trip. Shuttle was always on time and my car was safe.",
        created_at: "2025-01-10T07:00:00Z",
      },
      {
        author: "Huda Q.",
        rating: 4,
        comment:
          "Weekly rate is very reasonable. Luggage assistance was a nice bonus.",
        created_at: "2025-01-20T12:00:00Z",
      },
      {
        author: "Tariq J.",
        rating: 4,
        comment:
          "Well-lit and maintained. Shuttle every 15 minutes is very reliable.",
        created_at: "2025-02-01T06:00:00Z",
      },
      {
        author: "Amira G.",
        rating: 5,
        comment:
          "Best airport parking option. Long-term discounts make it unbeatable.",
        created_at: "2025-02-11T14:00:00Z",
      },
      {
        author: "Faisal B.",
        rating: 3,
        comment:
          "Good service but the open lot can get hot during summer. Wish there was shade.",
        created_at: "2025-02-21T09:00:00Z",
      },
    ],
  },
  {
    id: "park-seed-004",
    name: "Business District Tower Parking",
    description:
      "Multi-story automated parking facility with reserved spots for premium members.",
    zone_type: "multi_story",
    metadata: {
      thumbnail: "/seed-images/parking/1497366216548-37526070297c.jpg",
      price_per_hour: 600,
      images: ["/seed-images/parking/1497366216548-37526070297c.jpg"],
    },
    thumbnail: "/seed-images/parking/1497366216548-37526070297c.jpg",
    currency_code: "SAR",
    address: "789 King Abdullah Financial District",
    total_spots: 800,
    available_spots: 45,
    operating_hours: "5:00 AM - 11:00 PM",
    is_available: true,
    features: [
      "Automated parking system",
      "Reserved premium spots",
      "Monthly subscriptions",
      "Mobile app access",
    ],
    rates: [
      { label: "Hourly", price: 6.0, name: "Hourly Rate" },
      { label: "Daily Max", price: 50.0, name: "Daily Maximum" },
      { label: "Monthly Standard", price: 800.0, name: "Monthly Standard" },
      { label: "Monthly Premium", price: 1200.0, name: "Monthly Reserved" },
    ],
    rules: [
      "Reserved spots are for permit holders only",
      "No oversized vehicles (max 2.0m height)",
      "Park within designated lines",
      "Report malfunctions to management",
    ],
    reviews: [
      {
        author: "Waleed L.",
        rating: 4,
        comment:
          "The automated system is fast and efficient. Love the mobile app access.",
        created_at: "2025-01-06T08:00:00Z",
      },
      {
        author: "Salwa P.",
        rating: 5,
        comment:
          "Reserved premium spot is worth every riyal. Always guaranteed parking.",
        created_at: "2025-01-16T10:00:00Z",
      },
      {
        author: "Ziad E.",
        rating: 4,
        comment:
          "Great for the business district. Monthly subscription saves a lot of hassle.",
        created_at: "2025-01-26T14:00:00Z",
      },
      {
        author: "Noura C.",
        rating: 3,
        comment:
          "Good facility but fills up quickly. Need to arrive before 8 AM on weekdays.",
        created_at: "2025-02-06T09:00:00Z",
      },
      {
        author: "Karim V.",
        rating: 5,
        comment:
          "Best automated parking I've used. Smooth entry and exit every time.",
        created_at: "2025-02-16T12:00:00Z",
      },
    ],
  },
  {
    id: "park-seed-005",
    name: "Luxury Hotel Valet Parking",
    description:
      "White-glove valet service at the finest hotel, with car wash and detailing options.",
    zone_type: "valet",
    metadata: {
      thumbnail: "/seed-images/auctions/1489824904134-891ab64532f1.jpg",
      price_per_hour: 1500,
      images: ["/seed-images/auctions/1489824904134-891ab64532f1.jpg"],
    },
    thumbnail: "/seed-images/auctions/1489824904134-891ab64532f1.jpg",
    currency_code: "SAR",
    address: "Al Faisaliah Hotel, Riyadh",
    total_spots: 200,
    available_spots: 18,
    operating_hours: "24/7",
    is_available: true,
    features: [
      "White-glove valet service",
      "Car wash & detailing",
      "Climate-controlled garage",
      "VIP lounge access",
    ],
    rates: [
      { label: "Valet (per entry)", price: 15.0, name: "Valet Per Entry" },
      { label: "Hourly", price: 15.0, name: "Hourly Rate" },
      { label: "Daily", price: 100.0, name: "Daily Rate" },
      { label: "Car Wash Add-on", price: 50.0, name: "Car Wash" },
      { label: "Full Detail Add-on", price: 150.0, name: "Full Detailing" },
    ],
    rules: [
      "Valet-only parking (no self-park)",
      "Valuables must be removed from vehicle",
      "Tip not included in parking fee",
      "Vehicle must be claimed by midnight unless overnight booked",
    ],
    reviews: [
      {
        author: "Ghada Y.",
        rating: 5,
        comment:
          "White-glove service that truly lives up to its name. Car returned spotless.",
        created_at: "2025-01-04T18:00:00Z",
      },
      {
        author: "Jaber H.",
        rating: 5,
        comment:
          "The car wash add-on is excellent. My car looked brand new after dinner.",
        created_at: "2025-01-14T20:00:00Z",
      },
      {
        author: "Dina R.",
        rating: 4,
        comment:
          "Premium experience. Climate-controlled garage is perfect for luxury vehicles.",
        created_at: "2025-01-24T19:00:00Z",
      },
      {
        author: "Sami O.",
        rating: 5,
        comment:
          "VIP lounge access while waiting for the car is a wonderful touch.",
        created_at: "2025-02-03T21:00:00Z",
      },
      {
        author: "Lamia T.",
        rating: 4,
        comment:
          "Expensive but worth it for special occasions. Service is impeccable.",
        created_at: "2025-02-13T17:00:00Z",
      },
    ],
  },
];

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const mod = req.scope.resolve("parking") as unknown as any;
    const { id } = req.params;
    const item = await mod.retrieveParkingZone(id);
    if (item) return res.json({ item: enrichDetailItem(item, "parking") });
    const seedItem = SEED_DATA.find((s) => s.id === id) || SEED_DATA[0];
    return res.json({ item: seedItem });
  } catch (error: unknown) {
    const { id } = req.params;
    const seedItem = SEED_DATA.find((s) => s.id === id) || SEED_DATA[0];
    return res.json({ item: seedItem });
  }
}
