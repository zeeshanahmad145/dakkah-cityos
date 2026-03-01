import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { handleApiError } from "../../../../../lib/api-error-handler";

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const companyModuleService = req.scope.resolve("company") as unknown as any;
    const { id } = req.params;
    const userId = req.auth_context?.actor_id || "system";

    const purchase_order = await companyModuleService.approvePurchaseOrder(
      id,
      userId,
    );

    res.json({ purchase_order });
  } catch (error: unknown) {
    handleApiError(res, error, "POST admin purchase-orders id approve");
  }
}
