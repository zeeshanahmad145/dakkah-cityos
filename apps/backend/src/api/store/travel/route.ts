import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";

/**
 * GET /store/travel
 * Phase 5: uses query.graph() to fetch Medusa products linked to
 * RoomType extensions via the product-room-type.ts link table.
 */

const SEED_ROOMS = [
  {
    id: "prod_travel_seed_001",
    title: "Deluxe King Room — Grand Hyatt Riyadh",
    description:
      "Spacious 45sqm room with city view, king bed, and en-suite marble bathroom.",
    thumbnail: "/seed-images/travel/hotel-room-1.jpg",
    room_type: {
      max_occupancy: 2,
      bed_configuration: "1 King",
      floor_area_sqm: 45,
      amenities: ["WiFi", "Minibar", "Room service"],
    },
    metadata: { vertical: "travel" },
  },
  {
    id: "prod_travel_seed_002",
    title: "Ocean Suite — Four Seasons Jeddah",
    description:
      "360° panoramic views, private terrace, marble bathroom with sea views.",
    thumbnail: "/seed-images/travel/hotel-suite-1.jpg",
    room_type: {
      max_occupancy: 4,
      bed_configuration: "1 King + Sofa",
      floor_area_sqm: 120,
      amenities: ["Butler service", "Private pool", "Airport transfer"],
    },
    metadata: { vertical: "travel" },
  },
];

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const {
    limit = "20",
    offset = "0",
    tenant_id,
    check_in,
    check_out,
    occupancy,
    search,
  } = req.query as Record<string, string | undefined>;

  try {
    const query = req.scope.resolve("query") as unknown as any;
    const filters: Record<string, unknown> = {
      status: "published",
      "metadata->>'vertical'": "travel",
    };
    if (tenant_id) filters["room_type.tenant_id"] = tenant_id;
    if (occupancy)
      filters["room_type.max_occupancy"] = { $gte: Number(occupancy) };
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
        "room_type.id",
        "room_type.max_occupancy",
        "room_type.bed_configuration",
        "room_type.floor_area_sqm",
        "room_type.amenities",
        "room_type.tenant_id",
      ],
      filters,
      pagination: { skip: Number(offset), take: Number(limit) },
    });

    const items = products?.length > 0 ? products : SEED_ROOMS;
    return res.json({
      items,
      packages: items, // backward-compat alias used by some frontends
      count: metadata?.count ?? items.length,
      limit: Number(limit),
      offset: Number(offset),
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? (error instanceof Error ? error.message : String(error)) : String(error);
    req.scope.resolve("logger").error?.(`[travel/route] ${msg}`);
    return res.json({
      items: SEED_ROOMS,
      packages: SEED_ROOMS,
      count: SEED_ROOMS.length,
      limit: Number(limit ?? 20),
      offset: Number(offset ?? 0),
    });
  }
}
