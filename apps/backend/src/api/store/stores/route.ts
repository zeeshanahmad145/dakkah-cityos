import type { MedusaRequest, MedusaResponse } from "@medusajs/framework";
import { handleApiError } from "../../../lib/api-error-handler";

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const storeModuleService = req.scope.resolve("cityosStoreService") as unknown as any;

  try {
    const {
      limit = "20",
      offset = "0",
      tenant_id,
      region_id,
    } = req.query as Record<string, string | undefined>;
    const filters: Record<string, any> = { is_active: true };
    if (tenant_id) filters.tenant_id = tenant_id;
    if (region_id) filters.region_id = region_id;

    const stores = await storeModuleService.listStores(filters, {
      skip: Number(offset),
      take: Number(limit),
    });

    res.json({
      stores,
      count: Array.isArray(stores) ? stores.length : 0,
      limit: Number(limit),
      offset: Number(offset),
    });
  } catch (error: unknown) {
    handleApiError(res, error, "STORE-STORES");
  }
};

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  try {
    const storeModuleService = req.scope.resolve("cityosStoreService") as unknown as any;
    const { name, handle, tenant_id, region_id, metadata } = req.body as {
      name: string;
      handle?: string;
      tenant_id: string;
      region_id?: string;
      metadata?: Record<string, unknown>;
    };

    if (!name || !tenant_id) {
      return res
        .status(400)
        .json({ message: "name and tenant_id are required" });
    }

    const store = await storeModuleService.createStores({
      name,
      handle: handle ?? name.toLowerCase().replace(/\s+/g, "-"),
      tenant_id,
      region_id: region_id ?? null,
      is_active: false,
      metadata: metadata ?? null,
    });

    res.status(201).json({ store });
  } catch (error: unknown) {
    handleApiError(res, error, "STORE-STORES");
  }
};
