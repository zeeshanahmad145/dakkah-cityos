import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "zod"
import { handleApiError } from "../../../../lib/api-error-handler"

const updateSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  short_description: z.string().nullable().optional(),
  instructor_id: z.string().nullable().optional(),
  category: z.string().nullable().optional(),
  subcategory: z.string().nullable().optional(),
  level: z.enum(["beginner", "intermediate", "advanced", "all_levels"]).optional(),
  format: z.enum(["self_paced", "live", "hybrid", "in_person"]).optional(),
  language: z.string().optional(),
  price: z.number().nullable().optional(),
  currency_code: z.string().nullable().optional(),
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
}).passthrough()

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const moduleService = req.scope.resolve("education") as any
    const { id } = req.params
    const [item] = await moduleService.listCourses({ id }, { take: 1 })
    if (!item) return res.status(404).json({ message: "Not found" })
    return res.json({ item })

  } catch (error: any) {
    handleApiError(res, error, "GET admin education id")}
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const moduleService = req.scope.resolve("education") as any
    const { id } = req.params
    const validation = updateSchema.safeParse(req.body)
    if (!validation.success) return res.status(400).json({ message: "Validation failed", errors: validation.error.issues })
    const item = await moduleService.updateCourses({ id, ...validation.data })
    return res.json({ item })

  } catch (error: any) {
    handleApiError(res, error, "POST admin education id")}
}

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  try {
    const moduleService = req.scope.resolve("education") as any
    const { id } = req.params
    await moduleService.deleteCourses([id])
    return res.status(204).send()

  } catch (error: any) {
    handleApiError(res, error, "DELETE admin education id")}
}

