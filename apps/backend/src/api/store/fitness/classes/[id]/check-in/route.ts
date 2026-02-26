import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { handleApiError } from "../../../../../../lib/api-error-handler";

export const AUTHENTICATE = false

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const fitnessService = req.scope.resolve("fitness") as any;
    const classId = req.params.id;
    const { customer_id, action } = req.body as { customer_id?: string; action?: string };

    const guestId = customer_id || `guest_${Date.now()}`

    if (action === "check-in") {
      const result = await fitnessService.trackAttendance(classId, guestId);
      return res.json({ booking: result, checked_in: true });
    }

    const result = await fitnessService.bookClass(classId, guestId);
    return res.json({ booking: result, booked: true, message: "Class booked successfully" });
  } catch (error: any) {
    if (error.message?.includes("fully booked")) {
      return res.status(409).json({ error: error.message });
    }
    if (error.message?.includes("already booked")) {
      return res.status(409).json({ error: error.message });
    }
    return handleApiError(res, error, "STORE-FITNESS-BOOKING");
  }
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const fitnessService = req.scope.resolve("fitness") as any;
    const classId = req.params.id;
    const availability = await fitnessService.getClassAvailability(classId);
    return res.json({ availability });
  } catch (error: any) {
    return handleApiError(res, error, "STORE-FITNESS-AVAILABILITY");
  }
}
