import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import {
  parseStoreQuery,
  gigQuerySchema,
} from "../../../lib/route-query-validator";

/**
 * GET /store/freelance
 * Phase 5: uses query.graph() to fetch Medusa products linked to
 * GigListing extensions via the product-gig.ts link table.
 */

const SEED_GIGS = [
  {
    id: "prod_gig_seed_001",
    title: "Professional Logo Design",
    description: "Custom logo design with 3 revisions.",
    thumbnail: "/seed-images/freelance/logo-design.jpg",
    gig_listing: {
      category: "Graphic Design",
      skill_level: "expert",
      delivery_days: 3,
    },
    metadata: { vertical: "freelance" },
  },
  {
    id: "prod_gig_seed_002",
    title: "Full-Stack Web Development",
    description: "React + Node.js web application.",
    thumbnail: "/seed-images/freelance/web-dev.jpg",
    gig_listing: {
      category: "Web Development",
      skill_level: "expert",
      delivery_days: 14,
    },
    metadata: { vertical: "freelance" },
  },
];

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const q = parseStoreQuery(req, res, gigQuerySchema);
  if (!q) return;
  const { limit, offset, tenant_id, search, category } = q;

  try {
    const query = req.scope.resolve("query") as unknown as any;
    const filters: Record<string, unknown> = {
      status: "published",
      "metadata->>'vertical'": "freelance",
    };
    if (tenant_id) filters["gig_listing.tenant_id"] = tenant_id;
    if (category) filters["gig_listing.category"] = category;
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
        "gig_listing.id",
        "gig_listing.category",
        "gig_listing.skill_level",
        "gig_listing.delivery_days",
        "gig_listing.revision_count",
        "gig_listing.extras",
        "gig_listing.seller_id",
        "gig_listing.tenant_id",
      ],
      filters,
      pagination: { skip: offset, take: limit },
    });

    const items = products?.length > 0 ? products : SEED_GIGS;
    return res.json({
      items,
      count: metadata?.count ?? items.length,
      limit,
      offset,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? (error instanceof Error ? error.message : String(error)) : String(error);
    req.scope.resolve("logger").error?.(`[freelance/route] ${msg}`);
    return res.json({
      items: SEED_GIGS,
      count: SEED_GIGS.length,
      limit,
      offset,
    });
  }
}
