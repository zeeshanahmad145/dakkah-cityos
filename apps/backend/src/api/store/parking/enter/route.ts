import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { handleApiError } from "../../../../lib/api-error-handler";

/**
 * POST /store/parking/enter
 * Record a vehicle entering a parking zone (IoT gate event).
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const parkingService = req.scope.resolve("parking") as unknown as any;
    const { plate_number, zone_id, gate_id, customer_id } = req.body as {
      plate_number: string;
      zone_id: string;
      gate_id?: string;
      customer_id?: string;
    };

    if (!plate_number || !zone_id) {
      return res
        .status(400)
        .json({ error: "plate_number and zone_id are required" });
    }

    // Delegate to parking service — uses createParkingSessions or equivalent
    let session: any;
    if (typeof parkingService.startSession === "function") {
      session = await parkingService.startSession({
        plate_number,
        zone_id,
        gate_id,
        customer_id,
      });
    } else {
      // Fallback: generic parking operation
      session = await parkingService.createParkingSessions({
        plate_number,
        zone_id,
        gate_id: gate_id || null,
        customer_id: customer_id || null,
        entered_at: new Date(),
        status: "active",
      });
    }

    return res.status(201).json({ session, message: "Entry recorded" });
  } catch (error: unknown) {
    return handleApiError(res, error, "STORE-PARKING-ENTER");
  }
}
