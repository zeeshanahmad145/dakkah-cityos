import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { handleApiError } from "../../../../lib/api-error-handler";
import { sanitizeList } from "../../../../lib/image-sanitizer";

const SEED_FEATURED_VENDORS = [
  {
    id: "v-1",
    handle: "tech-haven",
    business_name: "Tech Haven Electronics",
    description:
      "Premium consumer electronics, gadgets, and accessories from top global brands.",
    logo_url: "/seed-images/vendors/1531297484001-80022131f5a1.jpg",
    banner_url: "/seed-images/vendors/1518770660439-4636190af475.jpg",
    is_verified: true,
    total_products: 245,
    rating: 4.8,
    review_count: 342,
  },
  {
    id: "v-2",
    handle: "green-living",
    business_name: "Green Living Co.",
    description:
      "Eco-friendly home products, organic goods, and sustainable lifestyle essentials.",
    logo_url: "/seed-images/vendors/1542601906990-b4d3fb778b09.jpg",
    banner_url: "/seed-images/vendors/1441974231531-c6227db76b6e.jpg",
    is_verified: true,
    total_products: 180,
    rating: 4.7,
    review_count: 215,
  },
  {
    id: "v-4",
    handle: "fashion-forward",
    business_name: "Fashion Forward Boutique",
    description:
      "Curated fashion collections featuring contemporary designs and trending styles.",
    logo_url: "/seed-images/vendors/1558171813-4c088753af8f.jpg",
    banner_url: "/seed-images/vendors/1441984904996-e0b6ba687e04.jpg",
    is_verified: true,
    total_products: 350,
    rating: 4.6,
    review_count: 410,
  },
  {
    id: "v-5",
    handle: "gourmet-delights",
    business_name: "Gourmet Delights",
    description:
      "Premium specialty foods, artisan ingredients, and curated gourmet gift baskets.",
    logo_url: "/seed-images/vendors/1504674900247-0877df9cc836.jpg",
    banner_url: "/seed-images/vendors/1555244162-803834f70033.jpg",
    is_verified: true,
    total_products: 95,
    rating: 4.8,
    review_count: 156,
  },
  {
    id: "vendor-albaik",
    handle: "al-baik",
    business_name: "Al Baik",
    description:
      "Saudi Arabia's beloved fried chicken restaurant chain, famous for its crispy broasted chicken and garlic sauce.",
    logo_url: "/seed-images/vendors/1626645738196-c2a7c87a8f58.jpg",
    banner_url: "/seed-images/vendors/1513639776629-7b61b0ac49cb.jpg",
    is_verified: true,
    total_products: 45,
    rating: 4.9,
    review_count: 2340,
  },
  {
    id: "v-3",
    handle: "artisan-crafts",
    business_name: "Artisan Crafts Market",
    description:
      "Handmade jewelry, pottery, textiles, and artisanal goods from local craftspeople.",
    logo_url: "/seed-images/vendors/1513364776144-60967b0f800f.jpg",
    banner_url: "/seed-images/vendors/1441984904996-e0b6ba687e04.jpg",
    is_verified: true,
    total_products: 120,
    rating: 4.9,
    review_count: 178,
  },
];

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const vendorModule = req.scope.resolve("vendor") as unknown as any;

  const { limit = 6 } = req.query;

  try {
    const vendors = await vendorModule.listVendors(
      {
        status: "active",
        verification_status: "approved",
      },
      {
        take: Number(limit),
        order: { total_orders: "DESC" },
      },
    );

    const vendorList = Array.isArray(vendors)
      ? vendors
      : [vendors].filter(Boolean);

    const featuredVendors = vendorList.map((vendor: any) => ({
      id: vendor.id,
      handle: vendor.handle,
      business_name: vendor.business_name,
      description: vendor.description,
      logo_url: vendor.logo_url,
      banner_url: vendor.banner_url,
      is_verified: vendor.verification_status === "approved",
      total_products: vendor.total_products,
      rating: vendor.rating || 0,
      review_count: vendor.review_count || 0,
    }));

    const result =
      featuredVendors.length > 0
        ? sanitizeList(featuredVendors, "vendors")
        : SEED_FEATURED_VENDORS.slice(0, Number(limit));

    res.json({
      vendors: result,
      count: result.length,
    });
  } catch (error: unknown) {
    const result = SEED_FEATURED_VENDORS.slice(0, Number(limit));
    res.json({ vendors: result, count: result.length });
  }
}
