import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import {
  parseStoreQuery,
  realEstateQuerySchema,
} from "../../../lib/route-query-validator";

/**
 * GET /store/real-estate / GET /store/real-estate/listings
 * Phase 5: query.graph() fetching products linked to PropertyListing extensions
 * via the product-property-listing.ts link table.
 */

const SEED_DATA = [
  {
    id: "prod_re_seed_001",
    title: "Luxury Villa — Diriyah Heritage District",
    description:
      "5-bedroom villa with private pool, home cinema, and landscaped garden.",
    thumbnail: "/seed-images/real-estate/villa-diriyah.jpg",
    property_listing: {
      property_type: "villa",
      listing_type: "sale",
      bedrooms: 5,
      bathrooms: 5,
      area_sqm: 750,
      floor: null,
      furnished: true,
      city: "Riyadh",
      neighborhood: "Diriyah",
    },
    metadata: { vertical: "real-estate" },
  },
  {
    id: "prod_re_seed_002",
    title: "Studio Apartment — NEOM Bay",
    description: "Modern studio with panoramic Red Sea views.",
    thumbnail: "/seed-images/real-estate/studio-neom.jpg",
    property_listing: {
      property_type: "apartment",
      listing_type: "rent",
      bedrooms: 0,
      bathrooms: 1,
      area_sqm: 42,
      floor: 12,
      furnished: true,
      city: "NEOM",
      neighborhood: "NEOM Bay",
    },
    metadata: { vertical: "real-estate" },
  },
];

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const q = parseStoreQuery(req, res, realEstateQuerySchema);
  if (!q) return;
  const {
    limit,
    offset,
    tenant_id,
    search,
    listing_type,
    property_type,
    city,
    bedrooms,
    furnished,
  } = q;

  try {
    const query = req.scope.resolve("query") as unknown as any;
    const filters: Record<string, unknown> = {
      status: "published",
      "metadata->>'vertical'": "real-estate",
    };
    if (tenant_id) filters["property_listing.tenant_id"] = tenant_id;
    if (listing_type) filters["property_listing.listing_type"] = listing_type;
    if (property_type)
      filters["property_listing.property_type"] = property_type;
    if (city) filters["property_listing.city"] = city;
    if (bedrooms) filters["property_listing.bedrooms"] = { $gte: bedrooms };
    if (furnished !== undefined)
      filters["property_listing.furnished"] = furnished;
    if (search) filters.title = { $ilike: `%${search}%` };

    const { data: products, metadata } = await query.graph({
      entity: "product",
      fields: [
        "id",
        "title",
        "description",
        "thumbnail",
        "handle",
        "metadata",
        "variants.id",
        "variants.title",
        "variants.calculated_price.*",
        "property_listing.id",
        "property_listing.property_type",
        "property_listing.listing_type",
        "property_listing.bedrooms",
        "property_listing.bathrooms",
        "property_listing.area_sqm",
        "property_listing.floor",
        "property_listing.furnished",
        "property_listing.city",
        "property_listing.neighborhood",
        "property_listing.latitude",
        "property_listing.longitude",
        "property_listing.agent_id",
        "property_listing.amenities",
      ],
      filters,
      pagination: { skip: offset, take: limit },
    });

    const listings = products?.length > 0 ? products : SEED_DATA;
    return res.json({
      listings,
      items: listings,
      count: metadata?.count ?? listings.length,
      limit: limit,
      offset: offset,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? (error instanceof Error ? error.message : String(error)) : String(error);
    req.scope.resolve("logger").error?.(`[real-estate/route] ${msg}`);
    return res.json({
      listings: SEED_DATA,
      items: SEED_DATA,
      count: SEED_DATA.length,
      limit: limit,
      offset: offset,
    });
  }
}
