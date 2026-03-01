import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { handleApiError } from "../../../../lib/api-error-handler";

/**
 * POST /store/ads/impression
 * Records an ad impression event.
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const advertisingService = req.scope.resolve("advertising") as unknown as any;
    const { ad_id, session_id, placement, metadata } = req.body as {
      ad_id: string;
      session_id: string;
      placement?: string;
      metadata?: Record<string, unknown>;
    };

    if (!ad_id || !session_id) {
      return res
        .status(400)
        .json({ error: "ad_id and session_id are required" });
    }

    if (typeof advertisingService.recordImpression === "function") {
      await advertisingService.recordImpression({
        adId: ad_id,
        sessionId: session_id,
        placement,
        metadata,
      });
    }

    return res.json({ recorded: true });
  } catch (error: unknown) {
    return handleApiError(res, error, "STORE-ADS-IMPRESSION");
  }
}
