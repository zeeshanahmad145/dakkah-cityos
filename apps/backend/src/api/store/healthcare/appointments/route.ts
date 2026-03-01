import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { handleApiError } from "../../../../lib/api-error-handler";

/**
 * POST /store/healthcare/appointments
 * Book a healthcare appointment with a practitioner.
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const healthcareService = req.scope.resolve("healthcare") as unknown as any;
    const { provider_id, patient_id, date } = req.body as {
      provider_id: string;
      patient_id: string;
      date: string;
    };

    if (!provider_id || !patient_id || !date) {
      return res
        .status(400)
        .json({ error: "provider_id, patient_id, and date are required" });
    }

    const appointment = await healthcareService.bookAppointment(
      provider_id,
      patient_id,
      new Date(date),
    );
    return res.status(201).json({ appointment });
  } catch (error: unknown) {
    return handleApiError(res, error, "STORE-HEALTHCARE-BOOK");
  }
}

/**
 * GET /store/healthcare/appointments
 * Get patient history (records, prescriptions, lab orders, appointments).
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const healthcareService = req.scope.resolve("healthcare") as unknown as any;
    const { patient_id } = req.query as { patient_id?: string };

    if (!patient_id) {
      return res.status(400).json({ error: "patient_id is required" });
    }

    const history = await healthcareService.getPatientHistory(patient_id);
    return res.json({ history });
  } catch (error: unknown) {
    return handleApiError(res, error, "STORE-HEALTHCARE-HISTORY");
  }
}
