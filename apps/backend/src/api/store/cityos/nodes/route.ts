import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { handleApiError } from "../../../../lib/api-error-handler";

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const tenantId =
    req.nodeContext?.tenantId || (req.query?.tenant_id as string);
  const parentId = req.query?.parent_id as string;
  const type = req.query?.type as string;

  if (!tenantId) {
    return res.status(400).json({ message: "Tenant context required" });
  }

  try {
    const nodeModule = req.scope.resolve("node") as unknown as any;

    const filters: Record<string, unknown> = { tenant_id: tenantId };
    if (parentId) filters.parent_id = parentId;
    if (type) filters.type = type;

    const nodes = await nodeModule.listNodesByTenant(tenantId, filters);
    return res.json({ nodes });
  } catch (error: unknown) {
    return handleApiError(res, error, "STORE-CITYOS-NODES");
  }
}
