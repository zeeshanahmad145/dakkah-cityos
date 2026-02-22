import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { handleApiError } from "../../../../../lib/api-error-handler";

const updateExceptionSchema = z.object({
  exception_type: z.enum(["time_off", "holiday", "special_hours", "blocked"]).optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  all_day: z.boolean().optional(),
  special_hours: z.array(z.object({ start: z.string(), end: z.string() })).optional(),
  title: z.string().optional(),
  reason: z.string().optional(),
}).passthrough()

export const PUT = async (req: MedusaRequest, res: MedusaResponse) => {
  try {
    const { exceptionId } = req.params;
    const bookingService = req.scope.resolve("booking") as any;

    const {
      exception_type,
      start_date,
      end_date,
      all_day,
      special_hours,
      title,
      reason,
    } = req.body as {
      exception_type?: "time_off" | "holiday" | "special_hours" | "blocked";
      start_date?: string;
      end_date?: string;
      all_day?: boolean;
      special_hours?: Array<{ start: string; end: string }>;
      title?: string;
      reason?: string;
    };

    const updateData: Record<string, any> = {};
    if (exception_type !== undefined)
      updateData.exception_type = exception_type;
    if (start_date !== undefined) updateData.start_date = new Date(start_date);
    if (end_date !== undefined) updateData.end_date = new Date(end_date);
    if (all_day !== undefined) updateData.all_day = all_day;
    if (special_hours !== undefined) updateData.special_hours = special_hours;
    if (title !== undefined) updateData.title = title;
    if (reason !== undefined) updateData.reason = reason;

    const exception = await bookingService.updateAvailabilityExceptions([
      {
        id: exceptionId,
        ...updateData,
      },
    ]);

    res.json({ exception: exception[0] });
  } catch (error: any) {
    handleApiError(res, error, "PUT admin availability exceptions exceptionId");
  }
};

export const DELETE = async (req: MedusaRequest, res: MedusaResponse) => {
  try {
    const { exceptionId } = req.params;
    const bookingService = req.scope.resolve("booking") as any;

    await bookingService.deleteAvailabilityExceptions([exceptionId]);

    res.status(200).json({ id: exceptionId, deleted: true });
  } catch (error: any) {
    handleApiError(
      res,
      error,
      "DELETE admin availability exceptions exceptionId",
    );
  }
};
