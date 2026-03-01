import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { z } from "zod";
import { handleApiError } from "../../../../lib/api-error-handler";

const createPageSchema = z
  .object({
    title: z.string().optional(),
    slug: z.string().optional(),
    type: z.string().optional(),
    content: z.string().optional(),
    excerpt: z.string().optional(),
    author: z.string().optional(),
    status: z.string().optional(),
    featured_image: z.string().optional(),
    seo_title: z.string().optional(),
    seo_description: z.string().optional(),
    locale: z.string().optional(),
    tenant_id: z.string().optional(),
    metadata: z.record(z.string(), z.unknown()).optional(),
  })
  .passthrough();

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const service = req.scope.resolve("cmsContent") as unknown as any;
    const filters: Record<string, any> = {};
    if (req.query.status) filters.status = req.query.status;
    if (req.query.q) filters.title = { $like: `%${req.query.q}%` };
    const pages = await service.listCmsPages(filters);
    res.json({ pages: Array.isArray(pages) ? pages : [pages].filter(Boolean) });
  } catch (error: unknown) {
    return handleApiError(res, error, "ADMIN-CMS-PAGES");
  }
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const service = req.scope.resolve("cmsContent") as unknown as any;
    const parsed = createPageSchema.safeParse(req.body);
    if (!parsed.success)
      return res
        .status(400)
        .json({ message: "Validation failed", errors: parsed.error.issues });
    const page = await service.createCmsPages(parsed.data);
    res.status(201).json({ page });
  } catch (error: unknown) {
    return handleApiError(res, error, "ADMIN-CMS-PAGES");
  }
}
