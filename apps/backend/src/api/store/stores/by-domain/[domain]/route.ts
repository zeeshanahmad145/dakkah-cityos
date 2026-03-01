import type { MedusaRequest, MedusaResponse } from "@medusajs/framework";
import { handleApiError } from "../../../../../lib/api-error-handler";

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const { domain } = req.params;
  const storeModuleService = req.scope.resolve("cityosStoreService") as unknown as any;

  try {
    const stores = await storeModuleService.listStores({
      custom_domain: domain,
      is_active: true,
    });

    if (!stores || stores.length === 0) {
      return res.status(404).json({
        message: `Store with domain '${domain}' not found`,
      });
    }

    res.json({ store: stores[0] });
  } catch (error: unknown) {
    handleApiError(res, error, "STORE-STORES-BY-DOMAIN-DOMAIN");
  }
};
