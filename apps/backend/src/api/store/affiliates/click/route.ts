import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { handleApiError } from "../../../../lib/api-error-handler";

/**
 * POST /store/affiliates/click
 * Record a referral link click for affiliate attribution.
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const affiliateService = req.scope.resolve("affiliate") as unknown as any;
    const { referral_code, product_id, source_url, user_agent } = req.body as {
      referral_code: string;
      product_id?: string;
      source_url?: string;
      user_agent?: string;
    };

    if (!referral_code) {
      return res.status(400).json({ error: "referral_code is required" });
    }

    // Look up the referral link by code
    const links = await affiliateService.listReferralLinks({
      code: referral_code,
    });
    const linkList = Array.isArray(links) ? links : [links].filter(Boolean);
    const link = linkList[0];

    if (!link) {
      return res.status(404).json({ error: "Referral code not found" });
    }

    // Record the click
    const click = await affiliateService.createClickTrackings({
      referral_link_id: link.id,
      affiliate_id: link.affiliate_id,
      product_id: product_id ?? null,
      source_url: source_url ?? null,
      user_agent: user_agent ?? req.headers["user-agent"] ?? null,
      ip_address: req.ip ?? null,
      clicked_at: new Date(),
    });

    // Increment link click count
    await affiliateService
      .updateReferralLinks({
        id: link.id,
        click_count: Number(link.click_count || 0) + 1,
      })
      .catch(() => null); // Best effort

    return res.json({
      tracked: true,
      click_id: click?.id,
      redirect_url: link.destination_url ?? null,
    });
  } catch (error: unknown) {
    return handleApiError(res, error, "STORE-AFFILIATE-CLICK");
  }
}
