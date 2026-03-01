import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { handleApiError } from "../../../../lib/api-error-handler";

/**
 * POST /store/vehicles/vin-lookup
 * Stub VIN lookup — returns vehicle metadata from VIN.
 * In production: wire to NHTSA VIN API or CarFax.
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const { vin } = req.body as { vin: string };

    if (!vin || vin.length !== 17) {
      return res
        .status(400)
        .json({ error: "Valid 17-character VIN is required" });
    }

    // Decode VIN structure (simplified — real impl calls NHTSA API)
    const year = parseInt(vin.charAt(9), 36);
    const currentYear = new Date().getFullYear();
    const modelYear = year <= currentYear % 100 ? 2000 + year : 1900 + year;

    return res.json({
      vin,
      decoded: {
        model_year: modelYear,
        country_of_origin:
          vin.charAt(0) === "1" ||
          vin.charAt(0) === "4" ||
          vin.charAt(0) === "5"
            ? "USA"
            : "Other",
        manufacturer_code: vin.substring(0, 3),
        check_digit_valid: true, // Simplified — real check is modular arithmetic
      },
      source: "stub", // Replace with "nhtsa" when integrated
    });
  } catch (error: unknown) {
    return handleApiError(res, error, "STORE-VIN-LOOKUP");
  }
}

/**
 * POST /store/vehicles/financing
 * Calculate monthly financing payment for a vehicle purchase.
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const automotiveService = req.scope.resolve("automotive") as unknown as any;
    const { price, down_payment, term_months, annual_rate } =
      req.query as Record<string, string>;

    if (!price || !down_payment || !term_months) {
      return res
        .status(400)
        .json({ error: "price, down_payment, and term_months are required" });
    }

    const result = await automotiveService.calculateFinancing(
      Number(price),
      Number(down_payment),
      Number(term_months),
      annual_rate ? Number(annual_rate) : undefined,
    );

    return res.json({ financing: result });
  } catch (error: unknown) {
    return handleApiError(res, error, "STORE-VEHICLE-FINANCING");
  }
}
