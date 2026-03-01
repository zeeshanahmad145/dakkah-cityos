import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { handleApiError } from "../../../../lib/api-error-handler";

/**
 * POST /store/shipping/rates
 * Get shipping rates for a cart/order — calls carrier API stub (FedEx/DHL/local).
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const shippingExtService = req.scope.resolve("shipping-extension") as unknown as any;
    const { origin, destination, weight_kg, dimensions, carrier } =
      req.body as {
        origin: { country: string; postal_code: string };
        destination: { country: string; postal_code: string };
        weight_kg: number;
        dimensions?: { length: number; width: number; height: number };
        carrier?: string;
      };

    if (!origin?.country || !destination?.country || !weight_kg) {
      return res
        .status(400)
        .json({ error: "origin, destination, and weight_kg are required" });
    }

    let rates: any[];
    if (typeof shippingExtService.getRates === "function") {
      rates = await shippingExtService.getRates({
        origin,
        destination,
        weight_kg,
        dimensions,
        carrier,
      });
    } else {
      // Stub carrier rates — replace with FedEx/DHL webhooks in production
      const baseRate = weight_kg * 2.5;
      const international = origin.country !== destination.country;
      rates = [
        {
          carrier: "standard",
          service: "Economy",
          estimated_days: international ? 7 : 3,
          price: Math.round(baseRate * 100) / 100,
          currency: "usd",
        },
        {
          carrier: "express",
          service: "Express",
          estimated_days: international ? 3 : 1,
          price: Math.round(baseRate * 2.2 * 100) / 100,
          currency: "usd",
        },
        {
          carrier: "overnight",
          service: "Overnight",
          estimated_days: 1,
          price: Math.round(baseRate * 4 * 100) / 100,
          currency: "usd",
        },
      ].filter((r) => !carrier || r.carrier === carrier);
    }

    return res.json({ rates, count: rates.length });
  } catch (error: unknown) {
    return handleApiError(res, error, "STORE-SHIPPING-RATES");
  }
}
