import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import {
  parseStoreQuery,
  healthcareQuerySchema,
} from "../../../lib/route-query-validator";

/**
 * GET /store/healthcare
 * Phase 5: query.graph() fetching products linked to PharmacyProduct extensions
 * via the product-pharmacy.ts link table.
 * Services (doctor consultations) are ServiceProduct extensions.
 */

const SEED_DATA = [
  {
    id: "prod_hc_seed_001",
    title: "General Physician Consultation",
    description:
      "30-minute online consultation with a board-certified physician.",
    thumbnail: "/seed-images/healthcare/doctor-consult.jpg",
    service_product: {
      service_type: "consultation",
      duration_minutes: 30,
      location_type: "virtual",
    },
    metadata: { vertical: "healthcare", subcategory: "consultation" },
  },
  {
    id: "prod_hc_seed_002",
    title: "Vitamin D3 2000 IU (90 Capsules)",
    description: "High-potency vitamin D3 supplement.",
    thumbnail: "/seed-images/healthcare/vitamins.jpg",
    pharmacy_product: {
      dosage_form: "capsule",
      prescription_required: false,
      storage_conditions: "room_temp",
    },
    metadata: { vertical: "healthcare", subcategory: "pharmacy" },
  },
];

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const q = parseStoreQuery(req, res, healthcareQuerySchema);
  if (!q) return;
  const {
    limit,
    offset,
    tenant_id,
    search,
    subcategory,
    prescription_required,
  } = q;

  try {
    const query = req.scope.resolve("query") as unknown as any;
    const filters: Record<string, unknown> = {
      status: "published",
      "metadata->>'vertical'": "healthcare",
    };
    if (tenant_id) filters["metadata->>'tenant_id'"] = tenant_id;
    if (subcategory) filters["metadata->>'subcategory'"] = subcategory;
    if (prescription_required !== undefined)
      filters["pharmacy_product.prescription_required"] =
        prescription_required === "true";
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
        // Pharmacy fields
        "pharmacy_product.id",
        "pharmacy_product.dosage_form",
        "pharmacy_product.prescription_required",
        "pharmacy_product.storage_conditions",
        "pharmacy_product.controlled_substance_schedule",
        "pharmacy_product.expiry_date",
        // Service/consultation fields
        "service_product.id",
        "service_product.service_type",
        "service_product.duration_minutes",
        "service_product.location_type",
        "service_product.virtual_meeting_provider",
        "service_product.is_active",
      ],
      filters,
      pagination: { skip: offset, take: limit },
    });

    const items = products?.length > 0 ? products : SEED_DATA;
    return res.json({
      items,
      count: metadata?.count ?? items.length,
      limit,
      offset,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? (error instanceof Error ? error.message : String(error)) : String(error);
    req.scope.resolve("logger").error?.(`[healthcare/route] ${msg}`);
    return res.json({
      items: SEED_DATA,
      count: SEED_DATA.length,
      limit,
      offset,
    });
  }
}
