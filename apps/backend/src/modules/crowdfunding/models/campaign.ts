import { model } from "@medusajs/framework/utils";

/**
 * CrowdfundCampaign stores campaign-domain metadata only.
 * Catalog (title, description, images) and currency_code are in Medusa Product + PriceSet
 * via src/links/product-crowdfund-campaign.ts
 * Reward tiers become Medusa product variants (each tier = a separate variant).
 * For donation campaigns: a single "Donate" product with price entered at checkout.
 */
const CrowdfundCampaign = model.define("crowdfund_campaign", {
  id: model.id().primaryKey(),
  tenant_id: model.text(),
  creator_id: model.text(),
  // REMOVED: title, description, short_description, images, currency_code
  // → these are now in Medusa Product + PriceSet
  campaign_type: model.enum(["reward", "equity", "donation", "debt"]),
  status: model
    .enum([
      "draft",
      "pending_review",
      "active",
      "funded",
      "failed",
      "cancelled",
    ])
    .default("draft"),
  // Funding progress (domain-specific — Medusa order totals inform raised_amount)
  goal_amount: model.bigNumber(),
  raised_amount: model.bigNumber().default(0),
  backer_count: model.number().default(0),
  // Campaign timeline
  starts_at: model.dateTime().nullable(),
  ends_at: model.dateTime(),
  is_flexible_funding: model.boolean().default(false),
  category: model.text().nullable(),
  video_url: model.text().nullable(),
  risks_and_challenges: model.text().nullable(),
  metadata: model.json().nullable(),
});

export default CrowdfundCampaign;
