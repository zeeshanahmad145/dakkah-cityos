import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { z } from "zod";
import { handleApiError } from "../../../lib/api-error-handler";

const createSchema = z
  .object({
    name: z.string().min(1),
    title: z.string().nullable().optional(),
    specialization: z.string().min(1),
    license_number: z.string().nullable().optional(),
    tenant_id: z.string().min(1),
    bio: z.string().nullable().optional(),
    education: z.any().nullable().optional(),
    experience_years: z.number().nullable().optional(),
    languages: z.any().nullable().optional(),
    consultation_fee: z.number().nullable().optional(),
    currency_code: z.string().nullable().optional(),
    consultation_duration_minutes: z.number().optional(),
    is_accepting_patients: z.boolean().optional(),
    photo_url: z.string().nullable().optional(),
    availability: z.any().nullable().optional(),
    metadata: z.record(z.string(), z.unknown()).nullable().optional(),
  })
  .passthrough();

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const moduleService = req.scope.resolve("healthcare") as unknown as any;
    const { limit = "20", offset = "0" } = req.query as Record<
      string,
      string | undefined
    >;
    const items = await moduleService.listPractitioners(
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
    handleApiError(res, error, "GET admin healthcare");
  }
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const moduleService = req.scope.resolve("healthcare") as unknown as any;
    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success)
      return res
        .status(400)
        .json({ message: "Validation failed", errors: parsed.error.issues });
    const raw = await moduleService.createPractitioners(parsed.data);
    const item = Array.isArray(raw) ? raw[0] : raw;
    return res.status(201).json({ item });
  } catch (error: unknown) {
    handleApiError(res, error, "POST admin healthcare");
  }
}
