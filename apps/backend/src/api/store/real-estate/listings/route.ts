import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { handleApiError } from "../../../../lib/api-error-handler"

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
    metadata: { thumbnail: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&h=600&fit=crop" },
    thumbnail: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&h=600&fit=crop",
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
    metadata: { thumbnail: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&h=600&fit=crop" },
    thumbnail: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&h=600&fit=crop",
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
    metadata: { thumbnail: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&h=600&fit=crop" },
    thumbnail: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&h=600&fit=crop",
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
    metadata: { thumbnail: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&h=600&fit=crop" },
    thumbnail: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&h=600&fit=crop",
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
    metadata: { thumbnail: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&h=600&fit=crop" },
    thumbnail: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&h=600&fit=crop",
  },
]

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const realEstateService = req.scope.resolve("realEstate") as any
    const { limit = "20", offset = "0" } = req.query as Record<string, string | undefined>
    const filters: Record<string, any> = { status: "active" }
    const items = await realEstateService.listPropertyListings(filters, {
      skip: Number(offset),
      take: Number(limit),
      order: { created_at: "DESC" },
    })
    const dbList = Array.isArray(items) ? items : []
    const itemList = dbList.length > 0 ? dbList : SEED_DATA
    return res.json({ items: itemList, count: itemList.length, limit: Number(limit), offset: Number(offset) })
  } catch (error: any) {
    return handleApiError(res, error, "STORE-REAL-ESTATE-LISTINGS")
  }
}
