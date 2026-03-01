import type { MedusaRequest, MedusaResponse } from "@medusajs/framework";
import { handleApiError } from "../../../../lib/api-error-handler";

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const storeModuleService = req.scope.resolve("cityosStoreService") as unknown as any;

  try {
    // Fetch the first active store as default
    const stores = await storeModuleService.listStores({
      is_active: true,
    });

    if (!stores || stores.length === 0) {
      return res.status(404).json({
        message: "No default store found",
      });
    }

    // Return the first store (or you could have an is_default flag)
    res.json({ store: stores[0] });
  } catch (error: unknown) {
    handleApiError(res, error, "STORE-STORES-DEFAULT");
  }
};
