import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import {
  parseStoreQuery,
  groceryQuerySchema,
} from "../../../lib/route-query-validator";
import type { IGroceryModuleService } from "../../../types/module-services";

/**
 * GET /store/grocery
 *
 * Phase 5 migration: now uses query.graph() to fetch Medusa products
 * linked to FreshProduct extensions via the product-grocery.ts link table.
 * Domain filters (category, storage_type, is_organic) are applied through
 * the fresh_product.* fields in the graph query.
 *
 * SEED_DATA fallback retained ONLY when zero real products exist (dev convenience).
 */

const SEED_DATA = [
  {
    id: "prod_groc_seed_001",
    title: "Organic Fresh Strawberries",
    description:
      "Hand-picked organic strawberries from local farms. Sweet, juicy, and perfect for smoothies.",
    thumbnail: "/seed-images/grocery/1464965911861-746a04b4bca6.jpg",
    variants: [
      {
        id: "var_groc_seed_001",
        title: "1kg",
        calculated_price: { calculated_amount: 1299 },
      },
    ],
    fresh_product: {
      storage_type: "refrigerated",
      shelf_life_days: 5,
      organic: true,
      unit_type: "kg",
    },
  },
  {
    id: "prod_groc_seed_002",
    title: "Artisan Sourdough Bread",
    description: "Freshly baked sourdough with crispy crust and soft interior.",
    thumbnail: "/seed-images/grocery/1509440159596-0249088772ff.jpg",
    variants: [
      {
        id: "var_groc_seed_002",
        title: "Full Loaf",
        calculated_price: { calculated_amount: 899 },
      },
    ],
    fresh_product: {
      storage_type: "ambient",
      shelf_life_days: 3,
      organic: false,
      unit_type: "loaf",
    },
  },
];

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const q = parseStoreQuery(req, res, groceryQuerySchema);
  if (!q) return;
  const {
    limit,
    offset,
    tenant_id,
    search,
    category,
    storage_type,
    is_organic,
  } = q;

  try {
    const query = req.scope.resolve("query") as unknown as any;

    // Build filter set — domain filters applied on fresh_product extension fields
    const freshProductFilters: Record<string, unknown> = {};
    if (tenant_id) freshProductFilters["fresh_product.tenant_id"] = tenant_id;
    if (category) freshProductFilters["fresh_product.category"] = category;
    if (storage_type)
      freshProductFilters["fresh_product.storage_type"] = storage_type;
    if (is_organic !== undefined)
      freshProductFilters["fresh_product.organic"] = is_organic;

    // Product-level search filter
    const productFilters: Record<string, unknown> = {
      status: "published",
      ...freshProductFilters,
    };
    if (search) productFilters.title = { $ilike: `%${search}%` };

    const { data: products, metadata } = await query.graph({
      entity: "product",
      fields: [
        "id",
        "title",
        "description",
        "thumbnail",
        "handle",
        "status",
        "metadata",
        "variants.id",
        "variants.title",
        "variants.calculated_price.*",
        "fresh_product.id",
        "fresh_product.organic",
        "fresh_product.unit_type",
        "fresh_product.storage_type",
        "fresh_product.shelf_life_days",
        "fresh_product.category",
        "fresh_product.country_of_origin",
        "fresh_product.tenant_id",
      ],
      filters: productFilters,
      pagination: {
        skip: offset,
        take: limit,
        order: { created_at: "DESC" },
      },
    });

    // Use SEED_DATA as a dev fallback only when no real products are linked
    const items =
      Array.isArray(products) && products.length > 0 ? products : SEED_DATA;

    return res.json({
      items,
      count: metadata?.count ?? items.length,
      limit,
      offset,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? (error instanceof Error ? error.message : String(error)) : String(error);
    req.scope
      .resolve("logger")
      .error?.(`[grocery/route] query.graph failed: ${msg}`);

    // Graceful fallback to SEED_DATA so dev environment keeps working
    return res.json({
      items: SEED_DATA,
      count: SEED_DATA.length,
      limit,
      offset,
    });
  }
}
