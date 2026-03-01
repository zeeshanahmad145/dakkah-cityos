import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { z } from "zod";
import { handleApiError } from "../../../../../lib/api-error-handler";

const createExceptionSchema = z
  .object({
    exception_type: z.enum(["time_off", "holiday", "special_hours", "blocked"]),
    start_date: z.string(),
    end_date: z.string(),
    all_day: z.boolean().optional(),
    special_hours: z
      .array(z.object({ start: z.string(), end: z.string() }))
      .optional(),
    title: z.string().optional(),
    reason: z.string().optional(),
    is_recurring: z.boolean().optional(),
    recurrence_rule: z.string().optional(),
  })
  .passthrough();

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  try {
    const { id } = req.params;
    const query = req.scope.resolve("query") as unknown as any;

    const { data: exceptions } = await query.graph({
      entity: "availability_exception",
      fields: ["*"],
      filters: { availability_id: id },
    });

    res.json({ exceptions });
  } catch (error: unknown) {
    handleApiError(res, error, "GET admin availability id exceptions");
  }
};

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  try {
    const { id } = req.params;
    const bookingService = req.scope.resolve("booking") as unknown as any;

    const parsed = createExceptionSchema.safeParse(req.body);
    if (!parsed.success) {
      return res
        .status(400)
        .json({ message: "Validation failed", errors: parsed.error.issues });
    }

    const {
      exception_type,
      start_date,
      end_date,
      all_day,
      special_hours,
      title,
      reason,
      is_recurring,
      recurrence_rule,
    } = parsed.data;

    const exception = await bookingService.createAvailabilityExceptions([
      {
        availability_id: id,
        exception_type,
        start_date: new Date(start_date),
        end_date: new Date(end_date),
        all_day: all_day || false,
        special_hours: special_hours,
        title,
        reason,
        is_recurring: is_recurring || false,
        recurrence_rule,
      },
    ]);

    res.status(201).json({ exception: exception[0] });
  } catch (error: unknown) {
    handleApiError(res, error, "POST admin availability id exceptions");
  }
};
