import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { handleApiError } from "../../../../lib/api-error-handler";
import { enrichDetailItem } from "../../../../lib/detail-enricher";

const SEED_DATA = [
  {
    id: "util-seed-1",
    name: "City Electric Power",
    description:
      "Reliable residential and commercial electricity service with 24/7 support and smart meter monitoring.",
    utility_type: "electricity",
    provider: "City Power Corp",
    status: "active",
    base_rate: 1200,
    rate_unit: "kWh",
    currency: "USD",
    billing_cycle: "monthly",
    features: [
      "Smart meter monitoring",
      "24/7 outage reporting",
      "Green energy options",
      "Budget billing available",
    ],
    service_area: "Metro Area",
    thumbnail: "/seed-images/government/1450101499163-c8848c66ca85.jpg",
    reviews: [
      {
        author: "Homeowner",
        rating: 5,
        comment: "Reliable service with excellent smart meter features.",
        created_at: "2024-06-15T00:00:00Z",
      },
      {
        author: "Business Owner",
        rating: 4,
        comment: "Competitive rates and great 24/7 support.",
        created_at: "2024-06-10T00:00:00Z",
      },
      {
        author: "Property Manager",
        rating: 5,
        comment: "Never had an outage issue. Very dependable.",
        created_at: "2024-05-28T00:00:00Z",
      },
      {
        author: "Green Advocate",
        rating: 4,
        comment: "Love the green energy options.",
        created_at: "2024-05-20T00:00:00Z",
      },
      {
        author: "Tenant",
        rating: 5,
        comment: "Budget billing makes it easy to plan expenses.",
        created_at: "2024-05-15T00:00:00Z",
      },
    ],
  },
  {
    id: "util-seed-2",
    name: "Pure Water Supply",
    description:
      "Clean municipal water service with quality monitoring and flexible payment plans.",
    utility_type: "water",
    provider: "Municipal Water Authority",
    status: "active",
    base_rate: 450,
    rate_unit: "gallon",
    currency: "USD",
    billing_cycle: "monthly",
    features: [
      "Water quality reports",
      "Leak detection alerts",
      "Conservation programs",
      "Online bill pay",
    ],
    service_area: "City Limits",
    thumbnail: "/seed-images/grocery/1414235077428-338989a2e8c0.jpg",
    reviews: [
      {
        author: "Resident",
        rating: 5,
        comment: "Clean water and great quality reports.",
        created_at: "2024-07-12T00:00:00Z",
      },
      {
        author: "Family Home",
        rating: 4,
        comment: "Leak detection alerts saved us from a big bill.",
        created_at: "2024-07-05T00:00:00Z",
      },
      {
        author: "Eco Resident",
        rating: 5,
        comment: "Conservation programs are easy to join.",
        created_at: "2024-06-28T00:00:00Z",
      },
      {
        author: "Condo Owner",
        rating: 4,
        comment: "Online bill pay is very convenient.",
        created_at: "2024-06-20T00:00:00Z",
      },
      {
        author: "New Homeowner",
        rating: 5,
        comment: "Smooth setup and transparent billing.",
        created_at: "2024-06-15T00:00:00Z",
      },
    ],
  },
  {
    id: "util-seed-3",
    name: "FiberNet Internet",
    description:
      "High-speed fiber optic internet service with symmetrical upload and download speeds.",
    utility_type: "internet",
    provider: "FiberNet Communications",
    status: "active",
    base_rate: 6999,
    rate_unit: "month",
    currency: "USD",
    billing_cycle: "monthly",
    features: [
      "1Gbps speeds",
      "No data caps",
      "Free installation",
      "Wi-Fi 6 router included",
    ],
    service_area: "Metro & Suburban",
    thumbnail: "/seed-images/digital-products/1506744038136-46273834b3fb.jpg",
    reviews: [
      {
        author: "Remote Worker",
        rating: 5,
        comment: "1Gbps speeds are incredible. No lag ever.",
        created_at: "2024-08-10T00:00:00Z",
      },
      {
        author: "Gamer",
        rating: 5,
        comment: "No data caps and Wi-Fi 6 router included. Perfect.",
        created_at: "2024-08-05T00:00:00Z",
      },
      {
        author: "Streamer",
        rating: 4,
        comment: "Great upload speeds for live streaming.",
        created_at: "2024-07-28T00:00:00Z",
      },
      {
        author: "Small Business",
        rating: 5,
        comment: "Free installation and reliable connection.",
        created_at: "2024-07-20T00:00:00Z",
      },
      {
        author: "Tech Enthusiast",
        rating: 4,
        comment: "Best ISP in the area by far.",
        created_at: "2024-07-15T00:00:00Z",
      },
    ],
  },
  {
    id: "util-seed-4",
    name: "Natural Gas Service",
    description:
      "Dependable natural gas delivery for heating, cooking, and industrial applications.",
    utility_type: "gas",
    provider: "Regional Gas Company",
    status: "active",
    base_rate: 850,
    rate_unit: "therm",
    currency: "USD",
    billing_cycle: "monthly",
    features: [
      "Safety inspections",
      "Budget billing",
      "Energy efficiency rebates",
      "Emergency service line",
    ],
    service_area: "Regional",
    thumbnail: "/seed-images/automotive/1556189250-72ba954cfc2b.jpg",
    reviews: [
      {
        author: "Homeowner",
        rating: 4,
        comment: "Safe and reliable gas service.",
        created_at: "2024-05-15T00:00:00Z",
      },
      {
        author: "Restaurant Owner",
        rating: 5,
        comment: "Energy efficiency rebates saved us a lot.",
        created_at: "2024-05-10T00:00:00Z",
      },
      {
        author: "Chef",
        rating: 4,
        comment: "Dependable for commercial kitchen use.",
        created_at: "2024-04-28T00:00:00Z",
      },
      {
        author: "Safety Inspector",
        rating: 5,
        comment: "Regular inspections give peace of mind.",
        created_at: "2024-04-20T00:00:00Z",
      },
      {
        author: "Manufacturer",
        rating: 4,
        comment: "Budget billing makes planning easier.",
        created_at: "2024-04-15T00:00:00Z",
      },
    ],
  },
  {
    id: "util-seed-5",
    name: "TeleCom Phone Service",
    description:
      "Comprehensive phone service with unlimited local and long-distance calling.",
    utility_type: "phone",
    provider: "TeleCom Networks",
    status: "active",
    base_rate: 3999,
    rate_unit: "month",
    currency: "USD",
    billing_cycle: "monthly",
    features: [
      "Unlimited calling",
      "Voicemail to email",
      "Call forwarding",
      "International rates from $0.02/min",
    ],
    service_area: "Nationwide",
    thumbnail: "/seed-images/freelance/1532094349884-543bc11b234d.jpg",
    reviews: [
      {
        author: "Business User",
        rating: 5,
        comment: "Crystal clear calls and great international rates.",
        created_at: "2024-09-10T00:00:00Z",
      },
      {
        author: "Office Manager",
        rating: 4,
        comment: "Voicemail to email feature is very useful.",
        created_at: "2024-09-05T00:00:00Z",
      },
      {
        author: "Sales Rep",
        rating: 5,
        comment: "Call forwarding works perfectly.",
        created_at: "2024-08-28T00:00:00Z",
      },
      {
        author: "Receptionist",
        rating: 4,
        comment: "Reliable service with no dropped calls.",
        created_at: "2024-08-20T00:00:00Z",
      },
      {
        author: "Consultant",
        rating: 5,
        comment: "Unlimited calling saves us a fortune.",
        created_at: "2024-08-15T00:00:00Z",
      },
    ],
  },
];

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const mod = req.scope.resolve("utilities") as unknown as any;
    const { id } = req.params;
    const [item] = await mod.listUtilityAccounts({ id }, { take: 1 });
    if (!item) {
      const seed = SEED_DATA.find((s) => s.id === id) || SEED_DATA[0];
      return res.json({ item: { ...seed, id } });
    }
    return res.json({ item: enrichDetailItem(item, "utilities") });
  } catch (error: unknown) {
    const { id } = req.params;
    const seed = SEED_DATA.find((s) => s.id === id) || SEED_DATA[0];
    return res.json({ item: { ...seed, id } });
  }
}
