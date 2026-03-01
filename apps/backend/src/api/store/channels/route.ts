import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { handleApiError } from "../../../lib/api-error-handler";

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const channelService = req.scope.resolve("channel") as unknown as any;
    const {
      channel_type,
      limit = "20",
      offset = "0",
      tenant_id,
    } = req.query as Record<string, string | undefined>;

    const filters: Record<string, any> = {
      is_active: true,
    };

    if (tenant_id) {
      filters.tenant_id = tenant_id;
    }

    if (channel_type) {
      filters.channel_type = channel_type;
    }

    const channels = await channelService.listSalesChannelMappings(filters, {
      take: Number(limit),
      skip: Number(offset),
      order: { created_at: "DESC" },
    });

    const items = Array.isArray(channels)
      ? channels
      : [channels].filter(Boolean);

    return res.json({
      items,
      count: items.length,
      limit: Number(limit),
      offset: Number(offset),
    });
  } catch (error: unknown) {
    handleApiError(res, error, "STORE-CHANNELS");
  }
}
