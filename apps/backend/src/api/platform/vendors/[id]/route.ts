import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { handleApiError } from "../../../../lib/api-error-handler";

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const tenantModule = req.scope.resolve("tenant") as unknown as any;
  const vendorModule = req.scope.resolve("vendor") as unknown as any;
  const { id } = req.params;

  try {
    const [vendor] = await vendorModule.listVendors({ id }, { take: 1 });
    if (!vendor) {
      return res.status(404).json({ message: "Vendor not found" });
    }

    let tenant = null;
    try {
      tenant = await tenantModule.retrieveTenant(vendor.tenant_id);
    } catch {}

    let pois: any[] = [];
    try {
      pois = await tenantModule.listTenantPois({ tenant_id: vendor.tenant_id });
      pois = Array.isArray(pois) ? pois : [pois].filter(Boolean);
    } catch {}

    let channels: any[] = [];
    try {
      channels = await tenantModule.listServiceChannels({
        tenant_id: vendor.tenant_id,
      });
      channels = Array.isArray(channels)
        ? channels
        : [channels].filter(Boolean);
    } catch {}

    let relationships: any[] = [];
    try {
      relationships = await tenantModule.listTenantRelationships({
        vendor_tenant_id: vendor.tenant_id,
      });
      relationships = Array.isArray(relationships)
        ? relationships
        : [relationships].filter(Boolean);
    } catch {}

    res.json({
      vendor: {
        ...vendor,
        scope_tier: tenant?.scope_tier || "nano",
        tenant_type: tenant?.tenant_type || "vendor",
        operating_countries: tenant?.operating_countries || [],
      },
      tenant: tenant
        ? {
            id: tenant.id,
            name: tenant.name,
            slug: tenant.slug,
            scope_tier: tenant.scope_tier,
            tenant_type: tenant.tenant_type,
            residency_zone: tenant.residency_zone,
            operating_countries: tenant.operating_countries,
          }
        : null,
      pois: pois.map((p: any) => ({
        id: p.id,
        name: p.name,
        poi_type: p.poi_type,
        city: p.city,
        country_code: p.country_code,
        is_primary: p.is_primary,
        latitude: p.latitude,
        longitude: p.longitude,
      })),
      channels: channels.map((c: any) => ({
        id: c.id,
        name: c.name,
        channel_type: c.channel_type,
        is_active: c.is_active,
        fulfillment_type: c.fulfillment_type,
      })),
      marketplace_relationships: relationships.map((r: any) => ({
        id: r.id,
        host_tenant_id: r.host_tenant_id,
        relationship_type: r.relationship_type,
        status: r.status,
        commission_rate: r.commission_rate,
      })),
    });
  } catch (error: unknown) {
    handleApiError(res, error, "PLATFORM-VENDORS-ID");
  }
}
