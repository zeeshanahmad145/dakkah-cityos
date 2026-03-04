import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { z } from "zod";
import { handleApiError } from "../../../lib/api-error-handler";

const createSchema = z
  .object({
    tenant_id: z.string(),
    title: z.string(),
    slug: z.string(),
    type: z.enum(["page", "post", "block"]).optional(),
    content: z.string().optional(),
    excerpt: z.string().optional(),
    author: z.string().optional(),
    status: z.enum(["draft", "published", "archived"]).optional(),
    featured_image: z.string().optional(),
    seo_title: z.string().optional(),
    seo_description: z.string().optional(),
    locale: z.string().optional(),
    metadata: z.record(z.string(), z.unknown()).optional(),
  })
  .passthrough();

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const mod = req.scope.resolve("cmsContent") as unknown as any;
    const {
      limit = "20",
      offset = "0",
      status,
      type,
    } = req.query as Record<string, string | undefined>;
    const filters: Record<string, any> = {};
    if (status) filters.status = status;
    if (type) filters.type = type;
    const items = await mod.listCmsPages(filters, {
      skip: Number(offset),
      take: Number(limit),
    });
    return res.json({
      items,
      count: Array.isArray(items) ? items.length : 0,
      limit: Number(limit),
      offset: Number(offset),
    });
  } catch (error: unknown) {
    handleApiError(res, error, "GET admin cms-content");
  }
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const mod = req.scope.resolve("cmsContent") as unknown as any;
    const validation = createSchema.safeParse(req.body);
    if (!validation.success)
      return res
        .status(400)
        .json({
          message: "Validation failed",
          errors: validation.error.issues,
        });
    const raw = await mod.createCmsPages(validation.data);
    const item = Array.isArray(raw) ? raw[0] : raw;
    return res.status(201).json({ item });
  } catch (error: unknown) {
    handleApiError(res, error, "POST admin cms-content");
  }
}
