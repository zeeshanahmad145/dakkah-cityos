import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { handleApiError } from "../../../../lib/api-error-handler";

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const tenantId =
    req.nodeContext?.tenantId || (req.query?.tenant_id as string);

  if (!tenantId) {
    return res.status(400).json({ message: "Tenant context required" });
  }

  try {
    const governanceModule = req.scope.resolve("governance") as unknown as any;
    const effectivePolicies =
      await governanceModule.resolveEffectivePolicies(tenantId);

    let authorities: any[] = [];
    try {
      const rawAuthorities = await governanceModule.listGovernanceAuthorities({
        tenant_id: tenantId,
      });
      authorities = Array.isArray(rawAuthorities)
        ? rawAuthorities
        : [rawAuthorities].filter(Boolean);
    } catch {
      authorities = [];
    }

    return res.json({
      authorities,
      effective_policies: effectivePolicies,
    });
  } catch (error: unknown) {
    return handleApiError(res, error, "STORE-CITYOS-GOVERNANCE");
  }
}
