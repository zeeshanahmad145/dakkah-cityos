import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { z } from "zod";
import { handleApiError } from "../../../lib/api-error-handler";

const createSchema = z
  .object({
    tenant_id: z.string().optional(),
    host_id: z.string(),
    title: z.string(),
    description: z.string().optional(),
    status: z.enum(["scheduled", "live", "ended", "cancelled"]).optional(),
    stream_url: z.string().optional(),
    platform: z
      .enum(["internal", "instagram", "tiktok", "youtube", "facebook"])
      .optional(),
    scheduled_at: z.string().optional(),
    thumbnail_url: z.string().optional(),
    metadata: z.record(z.string(), z.unknown()).optional(),
  })
  .passthrough();

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const mod = req.scope.resolve("socialCommerce") as unknown as any;
    const { limit = "20", offset = "0" } = req.query as Record<
      string,
      string | undefined
    >;
    const items = await mod.listLiveStreams(
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
    handleApiError(res, error, "GET admin social-commerce");
  }
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const mod = req.scope.resolve("socialCommerce") as unknown as any;
    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success)
      return res
        .status(400)
        .json({ message: "Validation failed", errors: parsed.error.issues });

    const cityosContext = req.cityosContext;
    const tenant_id = cityosContext?.tenantId || "default";

    const item = await mod.createLiveStreams({
      ...parsed.data,
      tenant_id,
    });
    return res.status(201).json({ item });
  } catch (error: unknown) {
    handleApiError(res, error, "POST admin social-commerce");
  }
}
