import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { handleApiError } from "../../../lib/api-error-handler";

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const taxConfigService = req.scope.resolve("taxConfig") as unknown as any;
    const { region, country_code, tenant_id } = req.query as Record<
      string,
      string | undefined
    >;

    const filters: Record<string, any> = {
      status: "active",
    };

    if (tenant_id) {
      filters.tenant_id = tenant_id;
    }

    if (country_code) {
      filters.country_code = country_code;
    }

    if (region) {
      filters.region_code = region;
    }

    const rules = await taxConfigService.listTaxRules(filters, {
      order: { priority: "DESC" },
    });

    const items = Array.isArray(rules) ? rules : [rules].filter(Boolean);

    return res.json({
      items,
      count: items.length,
    });
  } catch (error: unknown) {
    handleApiError(res, error, "STORE-TAX-CONFIG");
  }
}
