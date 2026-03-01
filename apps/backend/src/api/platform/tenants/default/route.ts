import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { handleApiError } from "../../../../lib/api-error-handler";
import {
  DEFAULT_TENANT_SLUG,
  buildNodeHierarchy,
  buildGovernanceChain,
  formatTenantResponse,
} from "../../../../lib/platform/index";

export const AUTHENTICATE = false;

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const tenantModule = req.scope.resolve("tenant") as unknown as any;
    const nodeModule = req.scope.resolve("node") as unknown as any;
    const governanceModule = req.scope.resolve("governance") as unknown as any;

    const tenant = await tenantModule.resolveTenant({
      slug: DEFAULT_TENANT_SLUG,
    });

    if (!tenant) {
      return res
        .status(503)
        .json({ success: false, message: "Default tenant unavailable" });
    }

    let nodeHierarchy: any[] = [];
    try {
      const flatNodes = await nodeModule.listNodesByTenant(tenant.id);
      nodeHierarchy = buildNodeHierarchy(flatNodes);
    } catch {
      nodeHierarchy = [];
    }

    let governanceChain: any = {
      region: null,
      country: null,
      authorities: [],
      policies: {},
    };
    try {
      const effectivePolicies = await governanceModule.resolveEffectivePolicies(
        tenant.id,
      );
      let authorities: any[] = [];
      try {
        const rawAuthorities = await governanceModule.listGovernanceAuthorities(
          { tenant_id: tenant.id },
        );
        authorities = Array.isArray(rawAuthorities)
          ? rawAuthorities
          : [rawAuthorities].filter(Boolean);
      } catch {
        authorities = [];
      }
      governanceChain = buildGovernanceChain(authorities, effectivePolicies);
    } catch {}

    const formattedTenant = formatTenantResponse(tenant);

    res.setHeader("Cache-Control", "public, max-age=300, s-maxage=600");

    return res.json({
      success: true,
      data: {
        tenant: formattedTenant,
        nodeHierarchy,
        governanceChain,
        usage: {
          description:
            "Use this tenant as fallback when no tenant-specific context is available",
          headers: {
            "X-CityOS-Tenant-Id": tenant.id,
            "X-CityOS-Locale": formattedTenant.settings.defaultLocale,
          },
          bootstrapUrl: `/platform/context?tenant=${DEFAULT_TENANT_SLUG}`,
        },
      },
    });
  } catch (error: unknown) {
    return handleApiError(res, error, "PLATFORM-TENANTS-DEFAULT");
  }
}
