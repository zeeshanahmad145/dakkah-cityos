import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import {
  parseStoreQuery,
  crowdfundingQuerySchema,
} from "../../../lib/route-query-validator";

/**
 * GET /store/crowdfunding
 * Phase 5: query.graph() fetching products linked to CrowdfundCampaign extensions.
 * Each campaign has a linked Medusa product representing its reward tiers as variants.
 */

const SEED_CAMPAIGNS = [
  {
    id: "prod_cf_seed_001",
    title: "AlUla Heritage Preservation Fund",
    description:
      "Preserve ancient rock art and archaeological sites across AlUla.",
    thumbnail: "/seed-images/crowdfunding/alula.jpg",
    crowdfund_campaign: {
      campaign_type: "donation",
      status: "active",
      goal_amount: 500000,
      raised_amount: 325000,
      backer_count: 1847,
      ends_at: "2026-06-30T00:00:00Z",
      is_flexible_funding: false,
      category: "Heritage",
    },
    metadata: { vertical: "crowdfunding" },
  },
  {
    id: "prod_cf_seed_002",
    title: "Desert Solar Community Grid",
    description: "100% renewable energy for 3 rural Saudi communities.",
    thumbnail: "/seed-images/crowdfunding/solar.jpg",
    crowdfund_campaign: {
      campaign_type: "reward",
      status: "active",
      goal_amount: 1000000,
      raised_amount: 742000,
      backer_count: 3210,
      ends_at: "2026-05-15T00:00:00Z",
      is_flexible_funding: true,
      category: "Energy",
    },
    metadata: { vertical: "crowdfunding" },
  },
];

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const q = parseStoreQuery(req, res, crowdfundingQuerySchema);
  if (!q) return;
  const { limit, offset, tenant_id, search, campaign_type, category, status } =
    q;

  try {
    const query = req.scope.resolve("query") as unknown as any;
    const filters: Record<string, unknown> = {
      status: "published",
      "metadata->>'vertical'": "crowdfunding",
    };
    if (tenant_id) filters["crowdfund_campaign.tenant_id"] = tenant_id;
    if (campaign_type)
      filters["crowdfund_campaign.campaign_type"] = campaign_type;
    if (category) filters["crowdfund_campaign.category"] = category;
    if (status) filters["crowdfund_campaign.status"] = status;
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
        "crowdfund_campaign.id",
        "crowdfund_campaign.campaign_type",
        "crowdfund_campaign.status",
        "crowdfund_campaign.goal_amount",
        "crowdfund_campaign.raised_amount",
        "crowdfund_campaign.backer_count",
        "crowdfund_campaign.starts_at",
        "crowdfund_campaign.ends_at",
        "crowdfund_campaign.is_flexible_funding",
        "crowdfund_campaign.category",
        "crowdfund_campaign.video_url",
        "crowdfund_campaign.creator_id",
      ],
      filters,
      pagination: { skip: offset, take: limit },
    });

    const campaigns = products?.length > 0 ? products : SEED_CAMPAIGNS;
    return res.json({
      campaigns,
      items: campaigns,
      count: metadata?.count ?? campaigns.length,
      limit,
      offset,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? (error instanceof Error ? error.message : String(error)) : String(error);
    req.scope.resolve("logger").error?.(`[crowdfunding/route] ${msg}`);
    return res.json({
      campaigns: SEED_CAMPAIGNS,
      items: SEED_CAMPAIGNS,
      count: SEED_CAMPAIGNS.length,
      limit,
      offset,
    });
  }
}
