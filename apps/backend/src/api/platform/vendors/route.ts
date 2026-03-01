import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { handleApiError } from "../../../lib/api-error-handler";

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const tenantModule = req.scope.resolve("tenant") as unknown as any;
  const vendorModule = req.scope.resolve("vendor") as unknown as any;

  const {
    marketplace_id,
    scope_tier,
    country_code,
    vertical,
    offset = 0,
    limit = 50,
  } = req.query;

  try {
    const filters: Record<string, unknown> = {};

    if (marketplace_id) {
      const relationships = await tenantModule.listTenantRelationships({
        host_tenant_id: marketplace_id,
        status: "active",
      });
      const vendorTenantIds = relationships.map((r: any) => r.vendor_tenant_id);

      if (vendorTenantIds.length === 0) {
        return res.json({
          vendors: [],
          count: 0,
          offset: Number(offset),
          limit: Number(limit),
        });
      }

      filters.tenant_id = vendorTenantIds;
    }

    if (scope_tier) filters.scope_tier = scope_tier;
    if (country_code) filters.country_code = country_code;
    if (vertical) filters.verticals = vertical;

    const vendors = await vendorModule.listVendors(
      { ...filters, status: "active" },
      { skip: Number(offset), take: Number(limit) },
    );

    const vendorList = Array.isArray(vendors)
      ? vendors
      : [vendors].filter(Boolean);

    const enrichedVendors = await Promise.all(
      vendorList.map(async (vendor: any) => {
        let tenant = null;
        if (vendor.tenant_id) {
          try {
            tenant = await tenantModule.retrieveTenant(vendor.tenant_id);
          } catch {}
        }

        return {
          id: vendor.id,
          handle: vendor.handle,
          tenant_id: vendor.tenant_id,
          business_name: vendor.business_name,
          description: vendor.description,
          logo_url: vendor.logo_url,
          banner_url: vendor.banner_url,
          verticals: vendor.verticals || [],
          country_code: vendor.country_code,
          total_products: vendor.total_products,
          scope_tier: tenant?.scope_tier || "nano",
          tenant_type: tenant?.tenant_type || "vendor",
          is_verified: vendor.verification_status === "approved",
          metadata: vendor.metadata,
        };
      }),
    );

    res.json({
      vendors: enrichedVendors,
      count: enrichedVendors.length,
      offset: Number(offset),
      limit: Number(limit),
    });
  } catch (error: unknown) {
    handleApiError(res, error, "PLATFORM-VENDORS");
  }
}
