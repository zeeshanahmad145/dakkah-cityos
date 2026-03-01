import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { handleApiError } from "../../../../lib/api-error-handler";

export const AUTHENTICATE = false;

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const fitnessService = req.scope.resolve("fitness") as unknown as any;
    const { customer_id, class_id } = req.body as {
      customer_id?: string;
      class_id?: string;
    };

    const cid = customer_id || `trial_${Date.now()}`;
    const result = await fitnessService.createMembership(cid, {
      membershipType: "basic",
      monthlyFee: 0,
      currencyCode: "SAR",
      durationMonths: 1,
    });

    let booking = null;
    if (class_id) {
      try {
        booking = await fitnessService.bookClass(class_id, cid);
      } catch {}
    }

    return res.json({
      trial: result,
      booking,
      message: "Free trial activated! You have 30 days of access.",
    });
  } catch (error: unknown) {
    return handleApiError(res, error, "STORE-FITNESS-TRIAL");
  }
}
