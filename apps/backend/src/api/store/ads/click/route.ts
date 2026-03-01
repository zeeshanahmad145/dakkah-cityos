import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { handleApiError } from "../../../../lib/api-error-handler";

/**
 * POST /store/ads/click
 * Records an ad click event and updates CTR analytics.
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const advertisingService = req.scope.resolve("advertising") as unknown as any;
    const { ad_id, session_id, redirect_url, metadata } = req.body as {
      ad_id: string;
      session_id: string;
      redirect_url?: string;
      metadata?: Record<string, unknown>;
    };

    if (!ad_id || !session_id) {
      return res
        .status(400)
        .json({ error: "ad_id and session_id are required" });
    }

    if (typeof advertisingService.recordClick === "function") {
      await advertisingService.recordClick({
        adId: ad_id,
        sessionId: session_id,
        metadata,
      });
    }

    // Return redirect_url so the storefront can handle navigation
    return res.json({ recorded: true, redirect_url: redirect_url || null });
  } catch (error: unknown) {
    return handleApiError(res, error, "STORE-ADS-CLICK");
  }
}
