import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import {
  parseStoreQuery,
  restaurantQuerySchema,
} from "../../../lib/route-query-validator";

/**
 * GET /store/restaurants/:id/order (and base /store/restaurants)
 * Phase 5: uses query.graph() to fetch Medusa products linked to
 * MenuItem extensions via the product-menu-item.ts link table.
 */

const SEED_MENUS = [
  {
    id: "prod_menu_seed_001",
    title: "Grilled Chicken Burger",
    description:
      "Flame-grilled chicken with lettuce, tomato, and special sauce.",
    thumbnail: "/seed-images/restaurant/burger.jpg",
    menu_item: {
      category: "Mains",
      prep_time_minutes: 15,
      allergens: [],
      dietary_tags: ["halal"],
      calories: 650,
    },
    metadata: { vertical: "restaurant" },
  },
  {
    id: "prod_menu_seed_002",
    title: "Caesar Salad",
    description:
      "Fresh romaine, parmesan, croutons, house-made Caesar dressing.",
    thumbnail: "/seed-images/restaurant/salad.jpg",
    menu_item: {
      category: "Starters",
      prep_time_minutes: 5,
      allergens: ["gluten", "dairy"],
      dietary_tags: [],
      calories: 420,
    },
    metadata: { vertical: "restaurant" },
  },
];

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const q = parseStoreQuery(req, res, restaurantQuerySchema);
  if (!q) return;
  const { limit, offset, tenant_id, search, category, menu_id } = q;

  try {
    const query = req.scope.resolve("query") as unknown as any;
    const filters: Record<string, unknown> = {
      status: "published",
      "metadata->>'vertical'": "restaurant",
    };
    if (tenant_id) filters["menu_item.tenant_id"] = tenant_id;
    if (category) filters["menu_item.category"] = category;
    if (menu_id) filters["menu_item.menu_id"] = menu_id;
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
        "menu_item.id",
        "menu_item.category",
        "menu_item.menu_id",
        "menu_item.is_featured",
        "menu_item.calories",
        "menu_item.allergens",
        "menu_item.dietary_tags",
        "menu_item.prep_time_minutes",
        "menu_item.display_order",
      ],
      filters,
      pagination: {
        skip: offset,
        take: limit,
        order: { "menu_item.display_order": "ASC" },
      },
    });

    const items = products?.length > 0 ? products : SEED_MENUS;
    return res.json({
      items,
      count: metadata?.count ?? items.length,
      limit,
      offset,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? (error instanceof Error ? error.message : String(error)) : String(error);
    req.scope.resolve("logger").error?.(`[restaurants/route] ${msg}`);
    return res.json({
      items: SEED_MENUS,
      count: SEED_MENUS.length,
      limit,
      offset,
    });
  }
}
