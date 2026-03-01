import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { z } from "zod";
import { handleApiError } from "../../../lib/api-error-handler";

const createSchema = z
  .object({
    title: z.string().min(1),
    description: z.string().nullable().optional(),
    short_description: z.string().nullable().optional(),
    instructor_id: z.string().nullable().optional(),
    category: z.string().nullable().optional(),
    subcategory: z.string().nullable().optional(),
    level: z
      .enum(["beginner", "intermediate", "advanced", "all_levels"])
      .optional(),
    format: z.enum(["self_paced", "live", "hybrid", "in_person"]),
    language: z.string().optional(),
    price: z.number().nullable().optional(),
    currency_code: z.string().nullable().optional(),
    tenant_id: z.string().min(1),
    duration_hours: z.number().nullable().optional(),
    syllabus: z.any().nullable().optional(),
    prerequisites: z.any().nullable().optional(),
    tags: z.any().nullable().optional(),
    status: z.enum(["draft", "published", "archived"]).optional(),
    is_free: z.boolean().optional(),
    certificate_offered: z.boolean().optional(),
    thumbnail_url: z.string().nullable().optional(),
    preview_video_url: z.string().nullable().optional(),
    metadata: z.record(z.string(), z.unknown()).nullable().optional(),
  })
  .passthrough();

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const moduleService = req.scope.resolve("education") as unknown as any;
    const { limit = "20", offset = "0" } = req.query as Record<
      string,
      string | undefined
    >;
    const items = await moduleService.listCourses(
      {},
      { skip: Number(offset), take: Number(limit) },
    );
    return res.json({
      items,
      count: Array.isArray(items) ? items.length : 0,
      limit: Number(limit),
      offset: Number(offset),
    });
  } catch (error: unknown) {
    handleApiError(res, error, "GET admin education");
  }
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const moduleService = req.scope.resolve("education") as unknown as any;
    const validation = createSchema.safeParse(req.body);
    if (!validation.success)
      return res
        .status(400)
        .json({
          message: "Validation failed",
          errors: validation.error.issues,
        });
    const item = await moduleService.createCourses(validation.data);
    return res.status(201).json({ item });
  } catch (error: unknown) {
    handleApiError(res, error, "POST admin education");
  }
}
