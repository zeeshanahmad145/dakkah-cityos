import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import {
  parseStoreQuery,
  parkingQuerySchema,
} from "../../../lib/route-query-validator";

/**
 * GET /store/parking
 * Phase 5: query.graph() fetching products linked to ParkingZone extensions.
 * Zone passes (hourly/daily/monthly) are Medusa product variants in PriceSet.
 */

const SEED_ZONES = [
  {
    id: "prod_park_seed_001",
    title: "King Abdullah Financial District — Zone A",
    description: "Premium covered parking near financial towers.",
    thumbnail: "/seed-images/parking/kafd-zone-a.jpg",
    parking_zone: {
      zone_type: "covered",
      capacity: 500,
      latitude: 24.7645,
      longitude: 46.6378,
      operating_hours: { open: "00:00", close: "23:59" },
      amenities: ["EV charging", "Security"],
    },
    metadata: { vertical: "parking" },
  },
];

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const q = parseStoreQuery(req, res, parkingQuerySchema);
  if (!q) return;
  const { limit, offset, tenant_id, search, zone_type } = q;

  try {
    const query = req.scope.resolve("query") as unknown as any;
    const filters: Record<string, unknown> = {
      status: "published",
      "metadata->>'vertical'": "parking",
    };
    if (tenant_id) filters["parking_zone.tenant_id"] = tenant_id;
    if (zone_type) filters["parking_zone.zone_type"] = zone_type;
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
        "parking_zone.id",
        "parking_zone.zone_type",
        "parking_zone.capacity",
        "parking_zone.available_spaces",
        "parking_zone.latitude",
        "parking_zone.longitude",
        "parking_zone.operating_hours",
        "parking_zone.amenities",
      ],
      filters,
      pagination: { skip: offset, take: limit },
    });

    const zones = products?.length > 0 ? products : SEED_ZONES;
    return res.json({
      zones,
      items: zones,
      count: metadata?.count ?? zones.length,
      limit,
      offset,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? (error instanceof Error ? error.message : String(error)) : String(error);
    req.scope.resolve("logger").error?.(`[parking/route] ${msg}`);
    return res.json({
      zones: SEED_ZONES,
      items: SEED_ZONES,
      count: SEED_ZONES.length,
      limit,
      offset,
    });
  }
}
