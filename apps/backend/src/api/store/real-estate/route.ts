import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { handleApiError } from "../../../lib/api-error-handler"

const SEED_DATA = [
  {
    id: "re_seed_1",
    tenant_id: "default",
    title: "Luxury Waterfront Villa",
    description: "Stunning 5-bedroom villa with private pool, landscaped garden, and panoramic sea views. Premium finishes throughout with smart home technology.",
    listing_type: "sale",
    property_type: "villa",
    status: "active",
    price: 85000000,
    currency_code: "SAR",
    address_line1: "Al Shati District",
    city: "Jeddah",
    bedrooms: 5,
    bathrooms: 6,
    area_sqm: 650,
    metadata: { thumbnail: "/seed-images/real-estate%2F1613490493576-7fde63acd811.jpg" },
    thumbnail: "/seed-images/real-estate%2F1613490493576-7fde63acd811.jpg",
  },
  {
    id: "re_seed_2",
    tenant_id: "default",
    title: "Modern Downtown Apartment",
    description: "Sleek 2-bedroom apartment in the heart of the city with floor-to-ceiling windows, modern kitchen, and access to rooftop pool and gym.",
    listing_type: "rent",
    property_type: "apartment",
    status: "active",
    price: 12000000,
    currency_code: "SAR",
    address_line1: "King Fahd Road",
    city: "Riyadh",
    bedrooms: 2,
    bathrooms: 2,
    area_sqm: 120,
    metadata: { thumbnail: "/seed-images/real-estate%2F1545324418-cc1a3fa10c00.jpg" },
    thumbnail: "/seed-images/real-estate%2F1545324418-cc1a3fa10c00.jpg",
  },
  {
    id: "re_seed_3",
    tenant_id: "default",
    title: "Premium Commercial Office Space",
    description: "Class A office space spanning 500 sqm with dedicated parking, meeting rooms, and high-speed connectivity in prime business district.",
    listing_type: "rent",
    property_type: "office",
    status: "active",
    price: 25000000,
    currency_code: "SAR",
    address_line1: "Business Gate",
    city: "Riyadh",
    bedrooms: 0,
    bathrooms: 4,
    area_sqm: 500,
    metadata: { thumbnail: "/seed-images/b2b%2F1486406146926-c627a92ad1ab.jpg" },
    thumbnail: "/seed-images/b2b%2F1486406146926-c627a92ad1ab.jpg",
  },
  {
    id: "re_seed_4",
    tenant_id: "default",
    title: "Waterfront Penthouse Suite",
    description: "Exclusive penthouse with 360-degree views, private terrace, chef's kitchen, and dedicated elevator access. The pinnacle of luxury living.",
    listing_type: "sale",
    property_type: "apartment",
    status: "active",
    price: 120000000,
    currency_code: "SAR",
    address_line1: "Corniche Road",
    city: "Jeddah",
    bedrooms: 4,
    bathrooms: 5,
    area_sqm: 450,
    metadata: { thumbnail: "/seed-images/real-estate%2F1512917774080-9991f1c4c750.jpg" },
    thumbnail: "/seed-images/real-estate%2F1512917774080-9991f1c4c750.jpg",
  },
  {
    id: "re_seed_5",
    tenant_id: "default",
    title: "Spacious Family Townhouse",
    description: "Beautiful 4-bedroom townhouse in a gated community with shared pool, playground, and 24/7 security. Perfect for families.",
    listing_type: "sale",
    property_type: "villa",
    status: "active",
    price: 35000000,
    currency_code: "SAR",
    address_line1: "Al Narjis District",
    city: "Riyadh",
    bedrooms: 4,
    bathrooms: 4,
    area_sqm: 320,
    metadata: { thumbnail: "/seed-images/real-estate%2F1600596542815-ffad4c1539a9.jpg" },
    thumbnail: "/seed-images/real-estate%2F1600596542815-ffad4c1539a9.jpg",
  },
]

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const realEstateService = req.scope.resolve("realEstate") as any
    const {
      limit = "20",
      offset = "0",
      tenant_id,
      city,
      property_type,
      listing_type,
      min_price,
      max_price,
      bedrooms,
      status,
      search,
    } = req.query as Record<string, string | undefined>

    const filters: Record<string, any> = {}
    if (tenant_id) filters.tenant_id = tenant_id
    if (city) filters.city = city
    if (property_type) filters.property_type = property_type
    if (listing_type) filters.listing_type = listing_type
    if (min_price) filters.price = { ...(filters.price || {}), $gte: Number(min_price) }
    if (max_price) filters.price = { ...(filters.price || {}), $lte: Number(max_price) }
    if (bedrooms) filters.bedrooms = Number(bedrooms)
    if (status) {
      filters.status = status
    } else {
      filters.status = "active"
    }
    if (search) filters.title = { $like: `%${search}%` }

    const items = await realEstateService.listPropertyListings(filters, {
      skip: Number(offset),
      take: Number(limit),
      order: { created_at: "DESC" },
    })

    const dbList = Array.isArray(items) ? items : []
    const itemList = dbList.length > 0 ? dbList : SEED_DATA

    return res.json({
      items: itemList,
      count: itemList.length,
      limit: Number(limit),
      offset: Number(offset),
    })
  } catch (error: any) {
    return handleApiError(res, error, "STORE-REAL-ESTATE")}
}

