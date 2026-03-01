import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { handleApiError } from "../../../../lib/api-error-handler";

/**
 * POST /store/parking/exit
 * Record a vehicle exiting a parking zone. Calculates fees.
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const parkingService = req.scope.resolve("parking") as unknown as any;
    const { plate_number, session_id, gate_id } = req.body as {
      plate_number?: string;
      session_id?: string;
      gate_id?: string;
    };

    if (!plate_number && !session_id) {
      return res
        .status(400)
        .json({ error: "plate_number or session_id is required" });
    }

    let result: any;
    if (typeof parkingService.endSession === "function") {
      result = await parkingService.endSession({
        plate_number,
        session_id,
        gate_id,
      });
    } else {
      // Fallback: find & close session by plate
      const sessions = await (parkingService as any).listParkingSessions({
        plate_number,
        status: "active",
      });
      const sessionList = Array.isArray(sessions)
        ? sessions
        : [sessions].filter(Boolean);
      if (!sessionList.length) {
        return res
          .status(404)
          .json({ error: "No active session found for this vehicle" });
      }
      const session = sessionList[0];
      const enteredAt = new Date(session.started_at);
      const exitedAt = new Date();
      const durationMinutes = Math.ceil(
        (exitedAt.getTime() - enteredAt.getTime()) / 60000,
      );
      const fee = Math.max(0, Math.ceil(durationMinutes / 60) * 5); // $5/hr

      result = await (parkingService as any).updateParkingSessions({
        id: session.id,
        exited_at: exitedAt,
        duration_minutes: durationMinutes,
        fee_amount: fee,
        status: "completed",
      });
    }

    return res.json({ result, message: "Exit recorded" });
  } catch (error: unknown) {
    return handleApiError(res, error, "STORE-PARKING-EXIT");
  }
}
