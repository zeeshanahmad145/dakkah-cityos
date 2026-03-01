import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { z } from "zod";
import { handleApiError } from "../../../lib/api-error-handler";

const createSchema = z.object({
  facility_id: z.string().nullable().optional(),
  class_name: z.string().min(1),
  description: z.string().nullable().optional(),
  class_type: z.enum([
    "yoga",
    "pilates",
    "hiit",
    "spinning",
    "boxing",
    "dance",
    "swimming",
    "crossfit",
    "meditation",
    "other",
  ]),
  day_of_week: z.enum([
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
    "sunday",
  ]),
  start_time: z.string().min(1),
  end_time: z.string().min(1),
  duration_minutes: z.number(),
  max_capacity: z.number(),
  room: z.string().nullable().optional(),
  difficulty: z
    .enum(["beginner", "intermediate", "advanced", "all_levels"])
    .optional(),
  is_recurring: z.boolean().optional(),
  is_active: z.boolean().optional(),
  metadata: z.record(z.string(), z.unknown()).nullable().optional(),
});

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const vendorId = req.vendor_id;
    if (!vendorId) {
      return res
        .status(401)
        .json({ message: "Vendor authentication required" });
    }

    const mod = req.scope.resolve("fitness") as unknown as any;
    const {
      limit = "20",
      offset = "0",
      status,
    } = req.query as Record<string, string | undefined>;

    const filters: Record<string, any> = { instructor_id: vendorId };
    if (status) filters.is_active = status === "active";

    const items = await mod.listClassSchedules(filters, {
      skip: Number(offset),
      take: Number(limit),
      order: { created_at: "DESC" },
    });

    return res.json({
      items,
      count: Array.isArray(items) ? items.length : 0,
      limit: Number(limit),
      offset: Number(offset),
    });
  } catch (error: unknown) {
    handleApiError(res, error, "GET vendor fitness");
  }
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const vendorId = req.vendor_id;
    if (!vendorId) {
      return res
        .status(401)
        .json({ message: "Vendor authentication required" });
    }

    const mod = req.scope.resolve("fitness") as unknown as any;
    const validation = createSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        message: "Validation failed",
        errors: validation.error.issues,
      });
    }

    const item = await mod.createClassSchedules({
      ...validation.data,
      instructor_id: vendorId,
    });

    return res.status(201).json({ item });
  } catch (error: unknown) {
    handleApiError(res, error, "POST vendor fitness");
  }
}
