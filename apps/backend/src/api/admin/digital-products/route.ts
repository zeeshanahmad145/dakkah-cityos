import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { z } from "zod";
import { handleApiError } from "../../../lib/api-error-handler";

const createSchema = z
  .object({
    tenant_id: z.string().optional(),
    product_id: z.string(),
    title: z.string(),
    file_url: z.string(),
    file_name: z.string(),
    file_type: z
      .enum([
        "pdf",
        "video",
        "audio",
        "image",
        "archive",
        "ebook",
        "software",
        "other",
      ])
      .or(z.string()),
    file_size: z.number().optional(),
    file_size_bytes: z.number().optional(),
    preview_url: z.string().optional(),
    version: z.string().optional(),
    max_downloads: z.number().optional(),
    is_active: z.boolean().optional(),
    metadata: z.record(z.string(), z.unknown()).optional(),
  })
  .passthrough();

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const mod = req.scope.resolve("digitalProduct") as unknown as any;
    const { limit = "20", offset = "0" } = req.query as Record<
      string,
      string | undefined
    >;
    const items = await mod.listDigitalAssets(
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
    handleApiError(res, error, "GET admin digital-products");
  }
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const mod = req.scope.resolve("digitalProduct") as unknown as any;
    const validation = createSchema.safeParse(req.body);
    if (!validation.success)
      return res.status(400).json({
        message: "Validation failed",
        errors: validation.error.issues,
      });

    const cityosContext = req.cityosContext;
    const tenant_id = cityosContext?.tenantId || "default";

    // Natively accept file_size mapping it to file_size_bytes for the DB if needed
    const file_size_bytes =
      validation.data.file_size_bytes || validation.data.file_size || 0;

    const item = await mod.createDigitalAssets({
      ...validation.data,
      file_size_bytes,
      tenant_id,
    });
    return res.status(201).json({ item });
  } catch (error: unknown) {
    handleApiError(res, error, "POST admin digital-products");
  }
}
