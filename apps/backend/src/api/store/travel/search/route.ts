import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { handleApiError } from "../../../../lib/api-error-handler";

/**
 * POST /store/travel/search
 * Search travel properties by location, dates, and guests (GDS stub).
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const travelService = req.scope.resolve("travel") as unknown as any;
    const {
      location,
      check_in,
      check_out,
      guests = 1,
      property_type,
    } = req.body as {
      location: string;
      check_in: string;
      check_out: string;
      guests?: number;
      property_type?: string;
    };

    if (!location || !check_in || !check_out) {
      return res
        .status(400)
        .json({ error: "location, check_in, and check_out are required" });
    }

    const checkIn = new Date(check_in);
    const checkOut = new Date(check_out);

    if (checkOut <= checkIn) {
      return res
        .status(400)
        .json({ error: "check_out must be after check_in" });
    }

    const nights = Math.ceil(
      (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24),
    );

    // Filter available properties from travel module
    const filters: Record<string, unknown> = { status: "active" };
    if (property_type) filters.property_type = property_type;

    const properties = await travelService.listPropertys(filters, {
      take: 20,
      skip: 0,
    });
    const list = Array.isArray(properties)
      ? properties
      : [properties].filter(Boolean);

    // Enrich with availability and nightly pricing
    const results = list.map((p: any) => ({
      ...p,
      nights,
      guests,
      check_in,
      check_out,
      available: true, // In production: check rate_plan availability for dates
    }));

    return res.json({
      results,
      count: results.length,
      search: { location, check_in, check_out, guests, nights },
    });
  } catch (error: unknown) {
    return handleApiError(res, error, "STORE-TRAVEL-SEARCH");
  }
}
