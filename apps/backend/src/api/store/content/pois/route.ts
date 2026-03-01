// @ts-nocheck
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { handleApiError } from "../../../../lib/api-error-handler";

const SEED_POIS = [
  {
    id: "poi-1",
    name: "Al Faisaliyah Tower",
    description:
      "Iconic skyscraper in the heart of Riyadh with observation deck, luxury shopping mall, and fine dining restaurants.",
    poi_type: "landmark",
    category: "attraction",
    thumbnail: "/seed-images/content/1586724237569-f3d0c1dee8c6.jpg",
    address_line1: "King Fahd Road, Olaya District",
    city: "Riyadh",
    country_code: "SA",
    latitude: 24.6908,
    longitude: 46.6854,
    rating: 4.7,
    review_count: 342,
    is_active: true,
    is_primary: true,
    opening_hours: "Sun-Thu 10AM-10PM, Fri-Sat 2PM-11PM",
    phone: "+966 11 273 2222",
    features: ["Observation Deck", "Shopping Mall", "Fine Dining", "Parking"],
  },
  {
    id: "poi-2",
    name: "Jeddah Corniche",
    description:
      "Beautiful waterfront promenade along the Red Sea coast, perfect for walking, cycling, and enjoying seaside views.",
    poi_type: "park",
    category: "recreation",
    thumbnail: "/seed-images/content/1578662996442-48f60103fc96.jpg",
    address_line1: "Corniche Road",
    city: "Jeddah",
    country_code: "SA",
    latitude: 21.5433,
    longitude: 39.1728,
    rating: 4.5,
    review_count: 567,
    is_active: true,
    is_primary: true,
    opening_hours: "Open 24 hours",
    phone: null,
    features: ["Walking Path", "Cycling Track", "Playgrounds", "Restaurants"],
  },
  {
    id: "poi-3",
    name: "Masmak Fortress",
    description:
      "Historic clay and mud-brick fortress in the center of Riyadh, now a museum showcasing Saudi heritage.",
    poi_type: "museum",
    category: "culture",
    thumbnail: "/seed-images/content/1548013146-72479768bada.jpg",
    address_line1: "Imam Turki Ibn Abdullah Street",
    city: "Riyadh",
    country_code: "SA",
    latitude: 24.6311,
    longitude: 46.7131,
    rating: 4.6,
    review_count: 289,
    is_active: true,
    is_primary: false,
    opening_hours: "Sat-Thu 8AM-12PM, 4PM-9PM",
    phone: "+966 11 411 0091",
    features: ["Museum", "Heritage Site", "Guided Tours", "Gift Shop"],
  },
  {
    id: "poi-4",
    name: "Boulevard Riyadh City",
    description:
      "Massive entertainment and leisure destination featuring dining, shopping, events, and world-class entertainment.",
    poi_type: "entertainment",
    category: "entertainment",
    thumbnail: "/seed-images/content/1519167758481-83f550bb49b3.jpg",
    address_line1: "Prince Mohammed bin Salman Road",
    city: "Riyadh",
    country_code: "SA",
    latitude: 24.7521,
    longitude: 46.657,
    rating: 4.8,
    review_count: 1203,
    is_active: true,
    is_primary: true,
    opening_hours: "Daily 4PM-2AM",
    phone: "+966 920 000 890",
    features: ["Restaurants", "Shopping", "Cinema", "Events", "Family Zone"],
  },
  {
    id: "poi-5",
    name: "King Abdullah Financial District",
    description:
      "Modern business hub and architectural landmark featuring stunning skyscrapers and corporate offices.",
    poi_type: "business",
    category: "business",
    thumbnail: "/seed-images/b2b/1486406146926-c627a92ad1ab.jpg",
    address_line1: "King Abdullah Financial District",
    city: "Riyadh",
    country_code: "SA",
    latitude: 24.7644,
    longitude: 46.64,
    rating: 4.4,
    review_count: 178,
    is_active: true,
    is_primary: false,
    opening_hours: "Sun-Thu 8AM-6PM",
    phone: null,
    features: [
      "Corporate Offices",
      "Conference Center",
      "Restaurants",
      "Transit Hub",
    ],
  },
  {
    id: "poi-6",
    name: "Edge of the World",
    description:
      "Dramatic cliff edge in the Tuwaiq Escarpment offering breathtaking panoramic views of the vast desert landscape below.",
    poi_type: "nature",
    category: "nature",
    thumbnail: "/seed-images/content/1682687220742-aba13b6e50ba.jpg",
    address_line1: "Tuwaiq Escarpment",
    city: "Riyadh Region",
    country_code: "SA",
    latitude: 24.8324,
    longitude: 46.2188,
    rating: 4.9,
    review_count: 891,
    is_active: true,
    is_primary: true,
    opening_hours: "Sunrise to Sunset",
    phone: null,
    features: ["Hiking", "Photography", "Camping", "Off-Road Access"],
  },
];

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const tenantModule = req.scope.resolve("tenant") as unknown as any;

    const {
      tenant_id,
      country_code,
      poi_type,
      is_active,
      limit = "20",
      offset = "0",
      q,
    } = req.query as Record<string, string>;

    const filters: Record<string, any> = {};
    if (tenant_id) filters.tenant_id = tenant_id;
    if (country_code) filters.country_code = country_code;
    if (poi_type) filters.poi_type = poi_type;
    if (is_active !== undefined) filters.is_active = is_active === "true";

    let pois = await tenantModule.listTenantPOIs(filters, {
      take: parseInt(limit),
      skip: parseInt(offset),
      order: { is_primary: "DESC", name: "ASC" },
    });

    pois = Array.isArray(pois) ? pois : [pois].filter(Boolean);

    if (pois.length === 0) {
      let filtered = [...SEED_POIS];
      if (q) {
        const query = q.toLowerCase();
        filtered = filtered.filter(
          (p) =>
            p.name.toLowerCase().includes(query) ||
            p.city.toLowerCase().includes(query),
        );
      }
      return res.json({
        pois: filtered,
        count: filtered.length,
        limit: parseInt(limit),
        offset: parseInt(offset),
      });
    }

    if (q) {
      const query = q.toLowerCase();
      pois = pois.filter(
        (poi: any) =>
          poi.name?.toLowerCase().includes(query) ||
          poi.city?.toLowerCase().includes(query) ||
          poi.address_line1?.toLowerCase().includes(query),
      );
    }

    const normalized = pois.map((poi: any) => ({
      ...poi,
      lat: poi.latitude,
      lng: poi.longitude,
    }));

    res.json({
      pois: normalized,
      count: normalized.length,
      limit: parseInt(limit),
      offset: parseInt(offset),
    });
  } catch (error: unknown) {
    const { q } = req.query as Record<string, string>;
    let filtered = [...SEED_POIS];
    if (q) {
      const query = q.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.city.toLowerCase().includes(query),
      );
    }
    return res.json({
      pois: filtered,
      count: filtered.length,
      limit: 20,
      offset: 0,
    });
  }
}
