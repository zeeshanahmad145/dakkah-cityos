import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { handleApiError } from "../../../../../lib/api-error-handler";

/**
 * POST /store/real-estate/:id/tour  — request a viewing appointment
 * GET  /store/real-estate/:id/tour  — get existing tour booking status
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const realEstateService = req.scope.resolve("realEstate") as unknown as any;
    const customerId = req.auth_context?.actor_id;
    const propertyId = req.params.id;

    if (!customerId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const {
      preferred_date,
      contact_phone,
      notes,
      tour_type = "in_person",
    } = req.body as {
      preferred_date: string;
      contact_phone?: string;
      notes?: string;
      tour_type?: string;
    };

    if (!preferred_date) {
      return res.status(400).json({ error: "preferred_date is required" });
    }

    // Verify property exists
    await realEstateService.retrievePropertyListing(propertyId);

    const appointment = await realEstateService.createViewingAppointments({
      property_id: propertyId,
      prospect_id: customerId,
      preferred_date: new Date(preferred_date),
      contact_phone: contact_phone ?? null,
      notes: notes ?? null,
      tour_type,
      status: "pending",
      requested_at: new Date(),
    });

    return res.status(201).json({
      appointment,
      message: "Tour request submitted. An agent will confirm shortly.",
    });
  } catch (error: unknown) {
    return handleApiError(res, error, "STORE-REAL-ESTATE-TOUR-CREATE");
  }
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const realEstateService = req.scope.resolve("realEstate") as unknown as any;
    const customerId = req.auth_context?.actor_id;
    const propertyId = req.params.id;

    if (!customerId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const appointments = await realEstateService.listViewingAppointments({
      property_id: propertyId,
      prospect_id: customerId,
    });
    const list = Array.isArray(appointments)
      ? appointments
      : [appointments].filter(Boolean);

    return res.json({ appointment: list[0] ?? null, appointments: list });
  } catch (error: unknown) {
    return handleApiError(res, error, "STORE-REAL-ESTATE-TOUR-GET");
  }
}
