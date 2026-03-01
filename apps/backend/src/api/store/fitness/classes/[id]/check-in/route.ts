import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { handleApiError } from "../../../../../../lib/api-error-handler";

export const AUTHENTICATE = false;

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const fitnessService = req.scope.resolve("fitness") as unknown as any;
    const classId = req.params.id;
    const { customer_id, action } = req.body as {
      customer_id?: string;
      action?: string;
    };

    const guestId = customer_id || `guest_${Date.now()}`;

    if (action === "check-in") {
      const result = await fitnessService.trackAttendance(classId, guestId);
      return res.json({ booking: result, checked_in: true });
    }

    const result = await fitnessService.bookClass(classId, guestId);
    return res.json({
      booking: result,
      booked: true,
      message: "Class booked successfully",
    });
  } catch (error: unknown) {
    if ((error instanceof Error ? error.message : String(error))?.includes("fully booked")) {
      return res.status(409).json({ error: (error instanceof Error ? error.message : String(error)) });
    }
    if ((error instanceof Error ? error.message : String(error))?.includes("already booked")) {
      return res.status(409).json({ error: (error instanceof Error ? error.message : String(error)) });
    }
    return handleApiError(res, error, "STORE-FITNESS-BOOKING");
  }
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const fitnessService = req.scope.resolve("fitness") as unknown as any;
    const classId = req.params.id;
    const availability = await fitnessService.getClassAvailability(classId);
    return res.json({ availability });
  } catch (error: unknown) {
    return handleApiError(res, error, "STORE-FITNESS-AVAILABILITY");
  }
}
