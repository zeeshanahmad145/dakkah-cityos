import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { handleApiError } from "../../../../../lib/api-error-handler";

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const vendorModule = req.scope.resolve("vendor") as unknown as any;
  const tenantModule = req.scope.resolve("tenant") as unknown as any;
  const { id } = req.params;

  try {
    const [vendor] = await vendorModule.listVendors({ id }, { take: 1 });
    if (!vendor) {
      return res.status(404).json({ message: "Vendor not found" });
    }

    let pois = await tenantModule.listTenantPois({
      tenant_id: vendor.tenant_id,
    });
    pois = Array.isArray(pois) ? pois : [pois].filter(Boolean);

    res.json({ pois, count: pois.length });
  } catch (error: unknown) {
    handleApiError(res, error, "PLATFORM-VENDORS-ID-POIS");
  }
}
