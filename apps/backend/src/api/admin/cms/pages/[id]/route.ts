import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { z } from "zod";
import { handleApiError } from "../../../../../lib/api-error-handler";

const updatePageSchema = z
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
    metadata: z.record(z.string(), z.unknown()).optional(),
  })
  .passthrough();

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const service = req.scope.resolve("cmsContent") as unknown as any;
    const page = await service.retrieveCmsPage(req.params.id);
    res.json({ page });
  } catch (error: unknown) {
    return handleApiError(res, error, "ADMIN-CMS-PAGES-ID");
  }
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const service = req.scope.resolve("cmsContent") as unknown as any;
    const parsed = updatePageSchema.safeParse(req.body);
    if (!parsed.success)
      return res
        .status(400)
        .json({ message: "Validation failed", errors: parsed.error.issues });
    const page = await service.updateCmsPages(req.params.id, parsed.data);
    res.json({ page });
  } catch (error: unknown) {
    return handleApiError(res, error, "ADMIN-CMS-PAGES-ID");
  }
}

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  try {
    const service = req.scope.resolve("cmsContent") as unknown as any;
    await service.deleteCmsPages(req.params.id);
    res.status(200).json({ id: req.params.id, deleted: true });
  } catch (error: unknown) {
    return handleApiError(res, error, "ADMIN-CMS-PAGES-ID");
  }
}
