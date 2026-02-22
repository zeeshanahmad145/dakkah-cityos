import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { handleApiError } from "../../../../lib/api-error-handler";

const updateAvailabilitySchema = z.object({
  weekly_schedule: z.any().optional(),
  timezone: z.string().optional(),
  effective_from: z.string().optional(),
  effective_to: z.string().optional(),
  slot_duration_minutes: z.number().optional(),
  slot_increment_minutes: z.number().optional(),
  is_active: z.boolean().optional(),
}).passthrough()

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  try {
    const { id } = req.params;
    const query = req.scope.resolve("query");

    const {
      data: [availability],
    } = await query.graph({
      entity: "availability",
      fields: ["*"],
      filters: { id },
    });

    if (!availability) {
      return res.status(404).json({ message: "Availability not found" });
    }

    // Get exceptions
    const { data: exceptions } = await query.graph({
      entity: "availability_exception",
      fields: ["*"],
      filters: { availability_id: id },
    });

    res.json({ availability, exceptions });
  } catch (error: any) {
    handleApiError(res, error, "GET admin availability id");
  }
};

export const PUT = async (req: MedusaRequest, res: MedusaResponse) => {
  try {
    const { id } = req.params;
    const bookingService = req.scope.resolve("booking") as any;

    const {
      weekly_schedule,
      timezone,
      effective_from,
      effective_to,
      slot_duration_minutes,
      slot_increment_minutes,
      is_active,
    } = req.body as {
      weekly_schedule?: Record<string, Array<{ start: string; end: string }>>;
      timezone?: string;
      effective_from?: string;
      effective_to?: string;
      slot_duration_minutes?: number;
      slot_increment_minutes?: number;
      is_active?: boolean;
    };

    const updateData: Record<string, any> = {};
    if (weekly_schedule !== undefined)
      updateData.weekly_schedule = weekly_schedule;
    if (timezone !== undefined) updateData.timezone = timezone;
    if (effective_from !== undefined)
      updateData.effective_from = effective_from
        ? new Date(effective_from)
        : null;
    if (effective_to !== undefined)
      updateData.effective_to = effective_to ? new Date(effective_to) : null;
    if (slot_duration_minutes !== undefined)
      updateData.slot_duration_minutes = slot_duration_minutes;
    if (slot_increment_minutes !== undefined)
      updateData.slot_increment_minutes = slot_increment_minutes;
    if (is_active !== undefined) updateData.is_active = is_active;

    const availability = await bookingService.updateAvailabilities([
      {
        id,
        ...updateData,
      },
    ]);

    res.json({ availability: availability[0] });
  } catch (error: any) {
    handleApiError(res, error, "PUT admin availability id");
  }
};

export const DELETE = async (req: MedusaRequest, res: MedusaResponse) => {
  try {
    const { id } = req.params;
    const bookingService = req.scope.resolve("booking") as any;

    await bookingService.deleteAvailabilities([id]);

    res.status(200).json({ id, deleted: true });
  } catch (error: any) {
    handleApiError(res, error, "DELETE admin availability id");
  }
};
