import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import {
  parseStoreQuery,
  vehicleQuerySchema,
} from "../../../lib/route-query-validator";

/**
 * GET /store/vehicles
 * Phase 5: uses query.graph() to fetch Medusa products linked to
 * VehicleListing extensions via the product-vehicle-listing.ts link table.
 */

const SEED_VEHICLES = [
  {
    id: "prod_veh_seed_001",
    title: "2023 BMW X5 xDrive40i",
    description:
      "Luxury SUV with panoramic sunroof, heated seats, and advanced driver aids.",
    thumbnail: "/seed-images/vehicles/bmw-x5.jpg",
    vehicle_listing: {
      make: "BMW",
      model_name: "X5",
      year: 2023,
      mileage_km: 0,
      fuel_type: "petrol",
      transmission: "automatic",
      condition: "new",
      listing_type: "sale",
    },
    metadata: { vertical: "automotive" },
  },
  {
    id: "prod_veh_seed_002",
    title: "2022 Tesla Model Y Long Range",
    description: "Electric SUV with 531km range, Autopilot, and 7-seat option.",
    thumbnail: "/seed-images/vehicles/tesla-model-y.jpg",
    vehicle_listing: {
      make: "Tesla",
      model_name: "Model Y",
      year: 2022,
      mileage_km: 15000,
      fuel_type: "electric",
      transmission: "automatic",
      condition: "certified_pre_owned",
      listing_type: "sale",
    },
    metadata: { vertical: "automotive" },
  },
];

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const q = parseStoreQuery(req, res, vehicleQuerySchema);
  if (!q) return;
  const {
    limit,
    offset,
    tenant_id,
    search,
    make,
    listing_type,
    condition,
    fuel_type,
  } = q;

  try {
    const query = req.scope.resolve("query") as unknown as any;
    const filters: Record<string, unknown> = {
      status: "published",
      "metadata->>'vertical'": "automotive",
    };
    if (tenant_id) filters["vehicle_listing.tenant_id"] = tenant_id;
    if (make) filters["vehicle_listing.make"] = make;
    if (listing_type) filters["vehicle_listing.listing_type"] = listing_type;
    if (condition) filters["vehicle_listing.condition"] = condition;
    if (fuel_type) filters["vehicle_listing.fuel_type"] = fuel_type;
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
        "vehicle_listing.id",
        "vehicle_listing.make",
        "vehicle_listing.model_name",
        "vehicle_listing.year",
        "vehicle_listing.mileage_km",
        "vehicle_listing.fuel_type",
        "vehicle_listing.transmission",
        "vehicle_listing.body_type",
        "vehicle_listing.color",
        "vehicle_listing.vin",
        "vehicle_listing.condition",
        "vehicle_listing.listing_type",
        "vehicle_listing.location_city",
        "vehicle_listing.location_country",
        "vehicle_listing.features",
        "vehicle_listing.seller_id",
      ],
      filters,
      pagination: { skip: offset, take: limit },
    });

    const items = products?.length > 0 ? products : SEED_VEHICLES;
    return res.json({
      items,
      count: metadata?.count ?? items.length,
      limit,
      offset,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? (error instanceof Error ? error.message : String(error)) : String(error);
    req.scope.resolve("logger").error?.(`[vehicles/route] ${msg}`);
    return res.json({
      items: SEED_VEHICLES,
      count: SEED_VEHICLES.length,
      limit,
      offset,
    });
  }
}
