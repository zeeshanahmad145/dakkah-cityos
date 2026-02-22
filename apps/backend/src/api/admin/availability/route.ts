import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { handleApiError } from "../../../lib/api-error-handler";

const createAvailabilitySchema = z.object({
  owner_type: z.enum(["provider", "service", "resource"]),
  owner_id: z.string(),
  schedule_type: z.enum(["weekly_recurring", "custom"]).optional(),
  weekly_schedule: z.any().optional(),
  timezone: z.string().optional(),
  effective_from: z.string().optional(),
  effective_to: z.string().optional(),
  slot_duration_minutes: z.number().optional(),
  slot_increment_minutes: z.number().optional(),
}).passthrough()

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  try {
    const query = req.scope.resolve("query");

    const { owner_type, owner_id, is_active } = req.query as {
      owner_type?: string;
      owner_id?: string;
      is_active?: string;
    };

    const filters: Record<string, any> = {};
    if (owner_type) filters.owner_type = owner_type;
    if (owner_id) filters.owner_id = owner_id;
    if (is_active !== undefined) filters.is_active = is_active === "true";

    const { data: availabilities } = await query.graph({
      entity: "availability",
      fields: ["*"],
      filters,
    });

    res.json({ availabilities });
  } catch (error: any) {
    handleApiError(res, error, "GET admin availability");
  }
};

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  try {
    const query = req.scope.resolve("query");
    const bookingService = req.scope.resolve("booking") as any;

    const {
      owner_type,
      owner_id,
      schedule_type,
      weekly_schedule,
      timezone,
      effective_from,
      effective_to,
      slot_duration_minutes,
      slot_increment_minutes,
    } = req.body as {
      owner_type: "provider" | "service" | "resource";
      owner_id: string;
      schedule_type?: "weekly_recurring" | "custom";
      weekly_schedule?: Record<string, Array<{ start: string; end: string }>>;
      timezone?: string;
      effective_from?: string;
      effective_to?: string;
      slot_duration_minutes?: number;
      slot_increment_minutes?: number;
    };

    const availability = await bookingService.createAvailabilities([
      {
        owner_type,
        owner_id,
        schedule_type: schedule_type || "weekly_recurring",
        weekly_schedule,
        timezone: timezone || "UTC",
        effective_from: effective_from ? new Date(effective_from) : null,
        effective_to: effective_to ? new Date(effective_to) : null,
        slot_duration_minutes: slot_duration_minutes || 30,
        slot_increment_minutes: slot_increment_minutes || 30,
        is_active: true,
      },
    ]);

    res.status(201).json({ availability: availability[0] });
  } catch (error: any) {
    handleApiError(res, error, "POST admin availability");
  }
};
