import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { handleApiError } from "../../../../lib/api-error-handler";

/**
 * POST /admin/tax-config/test-rate
 * Tests tax rate calculation for a given address + product category.
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const taxConfigService = req.scope.resolve("tax-config") as unknown as any;
    const { country, region, postal_code, product_category, amount } =
      req.body as {
        country: string;
        region?: string;
        postal_code?: string;
        product_category?: string;
        amount: number;
      };

    if (!country || amount <= 0) {
      return res
        .status(400)
        .json({ error: "country and amount > 0 are required" });
    }

    let result: any;
    if (typeof taxConfigService.testRate === "function") {
      result = await taxConfigService.testRate({
        country,
        region,
        postal_code,
        product_category,
        amount,
      });
    } else {
      // Stub: return a simple flat rate based on country
      const rates: Record<string, number> = {
        US: 0.08,
        GB: 0.2,
        DE: 0.19,
        SA: 0.15,
        AE: 0.05,
      };
      const rate = rates[country.toUpperCase()] ?? 0.1;
      result = {
        country,
        region: region ?? null,
        postal_code: postal_code ?? null,
        tax_rate: rate,
        tax_amount: Math.round(amount * rate * 100) / 100,
        total_with_tax: Math.round(amount * (1 + rate) * 100) / 100,
        source: "stub",
      };
    }

    return res.json({ result });
  } catch (error: unknown) {
    return handleApiError(res, error, "ADMIN-TAX-TEST-RATE");
  }
}
