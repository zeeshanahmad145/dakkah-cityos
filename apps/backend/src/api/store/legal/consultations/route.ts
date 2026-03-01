import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { handleApiError } from "../../../../lib/api-error-handler";

/**
 * GET  /store/legal/consultations  — list customer's legal consultations
 * POST /store/legal/consultations  — book a consultation with an attorney
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const legalService = req.scope.resolve("legal") as unknown as any;
    const customerId = req.auth_context?.actor_id;

    if (!customerId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const consultations = await legalService.listLegalConsultations({
      client_id: customerId,
    });
    const list = Array.isArray(consultations)
      ? consultations
      : [consultations].filter(Boolean);

    return res.json({ consultations: list, count: list.length });
  } catch (error: unknown) {
    return handleApiError(res, error, "STORE-LEGAL-CONSULTATIONS-LIST");
  }
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const legalService = req.scope.resolve("legal") as unknown as any;
    const customerId = req.auth_context?.actor_id;

    if (!customerId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const {
      attorney_id,
      practice_area,
      description,
      preferred_date,
      consultation_type = "video",
    } = req.body as {
      attorney_id?: string;
      practice_area: string;
      description: string;
      preferred_date?: string;
      consultation_type?: string;
    };

    if (!practice_area || !description) {
      return res
        .status(400)
        .json({ error: "practice_area and description are required" });
    }

    const consultation = await legalService.createLegalConsultations({
      client_id: customerId,
      attorney_id: attorney_id ?? null,
      practice_area,
      description,
      preferred_date: preferred_date ? new Date(preferred_date) : null,
      consultation_type,
      status: "pending",
      requested_at: new Date(),
    });

    return res.status(201).json({ consultation });
  } catch (error: unknown) {
    return handleApiError(res, error, "STORE-LEGAL-CONSULTATIONS-CREATE");
  }
}
