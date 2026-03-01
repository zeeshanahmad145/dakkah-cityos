import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { handleApiError } from "../../../../lib/api-error-handler";

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const tenantId =
    req.nodeContext?.tenantId || (req.query?.tenant_id as string);
  const userId = req.nodeContext?.userId || (req.query?.user_id as string);

  if (!tenantId) {
    return res.status(400).json({ message: "Tenant context required" });
  }

  try {
    const personaModule = req.scope.resolve("persona") as unknown as any;

    if (userId) {
      const persona = await personaModule.resolvePersona(tenantId, userId, {
        surface: req.nodeContext?.channel,
      });
      return res.json({ persona });
    }

    const personas = await personaModule.getPersonasForTenant(tenantId);
    return res.json({ personas });
  } catch (error: unknown) {
    return handleApiError(res, error, "STORE-CITYOS-PERSONA");
  }
}
