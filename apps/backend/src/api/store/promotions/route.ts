import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { handleApiError } from "../../../lib/api-error-handler";

const SEED_PROMOTIONS = [
  {
    id: "promo_001",
    title: "Summer Sale - 30% Off Electronics",
    description:
      "Get 30% off all electronics including smartphones, laptops, and accessories. Limited time offer.",
    code: "SUMMER30",
    discount_type: "percentage",
    discount_value: 30,
    category: "electronics",
    is_active: true,
    starts_at: "2025-06-01T00:00:00Z",
    expires_at: "2026-08-31T23:59:59Z",
    usage_limit: 500,
    usage_count: 187,
    min_order_amount: 10000,
    thumbnail: "/seed-images/flash-sales/1495474472287-4d71bcdd2085.jpg",
  },
  {
    id: "promo_002",
    title: "New Member Welcome - 20% Off First Order",
    description:
      "Welcome to Dakkah! Enjoy 20% off your first order. No minimum purchase required.",
    code: "WELCOME20",
    discount_type: "percentage",
    discount_value: 20,
    category: "general",
    is_active: true,
    starts_at: "2025-01-01T00:00:00Z",
    expires_at: "2026-12-31T23:59:59Z",
    usage_limit: 10000,
    usage_count: 3421,
    min_order_amount: 0,
    thumbnail: "/seed-images/memberships/1441986300917-64674bd600d8.jpg",
  },
  {
    id: "promo_003",
    title: "Free Shipping on Orders Over 200 SAR",
    description:
      "Enjoy free standard shipping on all orders over 200 SAR. Applies to all categories.",
    code: "FREESHIP200",
    discount_type: "free_shipping",
    discount_value: 0,
    category: "shipping",
    is_active: true,
    starts_at: "2025-03-01T00:00:00Z",
    expires_at: "2026-12-31T23:59:59Z",
    usage_limit: 0,
    usage_count: 8920,
    min_order_amount: 20000,
    thumbnail: "/seed-images/consignments/1548036328-c9fa89d128fa.jpg",
  },
  {
    id: "promo_004",
    title: "Buy 2 Get 1 Free - Fashion Collection",
    description:
      "Purchase any 2 items from our fashion collection and get the 3rd item free. Lowest priced item is free.",
    code: "B2G1FASHION",
    discount_type: "buy_x_get_y",
    discount_value: 100,
    category: "fashion",
    is_active: true,
    starts_at: "2025-04-01T00:00:00Z",
    expires_at: "2026-06-30T23:59:59Z",
    usage_limit: 1000,
    usage_count: 342,
    min_order_amount: 0,
    thumbnail: "/seed-images/social-commerce/1547887538-e3a2f32cb1cc.jpg",
  },
  {
    id: "promo_005",
    title: "Ramadan Special - 50 SAR Off",
    description:
      "Celebrate Ramadan with 50 SAR off orders over 300 SAR. Valid on all categories except gift cards.",
    code: "RAMADAN50",
    discount_type: "fixed",
    discount_value: 5000,
    category: "seasonal",
    is_active: true,
    starts_at: "2025-02-28T00:00:00Z",
    expires_at: "2026-04-01T23:59:59Z",
    usage_limit: 2000,
    usage_count: 876,
    min_order_amount: 30000,
    thumbnail: "/seed-images/charity/1469854523086-cc02fe5d8800.jpg",
  },
];

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const promotionExtService = req.scope.resolve(
      "promotionExt",
    ) as unknown as any;
    const {
      limit = "20",
      offset = "0",
      category,
      tenant_id,
    } = req.query as Record<string, string | undefined>;

    const filters: Record<string, any> = {
      is_active: true,
    };

    if (tenant_id) {
      filters.tenant_id = tenant_id;
    }

    if (category) {
      filters.category = category;
    }

    const now = new Date();
    filters.expires_at = { $gte: now };

    const promotions = await promotionExtService.listGiftCardExts(filters, {
      take: Number(limit),
      skip: Number(offset),
      order: { created_at: "DESC" },
    });

    const items = Array.isArray(promotions)
      ? promotions
      : [promotions].filter(Boolean);

    if (items.length === 0) {
      return res.json({
        items: SEED_PROMOTIONS,
        count: SEED_PROMOTIONS.length,
        limit: Number(limit),
        offset: Number(offset),
      });
    }

    return res.json({
      items,
      count: items.length,
      limit: Number(limit),
      offset: Number(offset),
    });
  } catch (error: unknown) {
    console.warn(
      "STORE-PROMOTIONS: falling back to seed data:",
      error instanceof Error ? error.message : String(error),
    );
    return res.json({
      items: SEED_PROMOTIONS,
      count: SEED_PROMOTIONS.length,
      limit: 20,
      offset: 0,
    });
  }
}
