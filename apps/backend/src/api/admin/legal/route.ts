import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { z } from "zod";
import { handleApiError } from "../../../lib/api-error-handler";

const createSchema = z
  .object({
    tenant_id: z.string(),
    user_id: z.string().optional(),
    name: z.string(),
    bar_number: z.string().optional(),
    specializations: z.any().optional(),
    practice_areas: z.any().optional(),
    bio: z.string().optional(),
    education: z.any().optional(),
    experience_years: z.number().optional(),
    hourly_rate: z.number().optional(),
    currency_code: z.string().optional(),
    is_accepting_cases: z.boolean().optional(),
    rating: z.number().optional(),
    photo_url: z.string().optional(),
    languages: z.any().optional(),
    metadata: z.record(z.string(), z.unknown()).optional(),
  })
  .passthrough();

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const mod = req.scope.resolve("legal") as unknown as any;
    const { limit = "20", offset = "0" } = req.query as Record<
      string,
      string | undefined
    >;
    const items = await mod.listAttorneyProfiles(
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
    handleApiError(res, error, "GET admin legal");
  }
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const mod = req.scope.resolve("legal") as unknown as any;
    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success)
      return res
        .status(400)
        .json({ message: "Validation failed", errors: parsed.error.issues });
    const raw = await mod.createAttorneyProfiles(parsed.data);
    const item = Array.isArray(raw) ? raw[0] : raw;
    return res.status(201).json({ item });
  } catch (error: unknown) {
    handleApiError(res, error, "POST admin legal");
  }
}
