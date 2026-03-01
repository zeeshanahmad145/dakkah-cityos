import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { handleApiError } from "../../../../lib/api-error-handler";

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const slug = req.query?.slug as string;
  const domain = req.query?.domain as string;
  const handle = req.query?.handle as string;

  if (!slug && !domain && !handle) {
    return res.status(400).json({
      message: "Must provide slug, domain, or handle query parameter",
    });
  }

  try {
    const tenantModule = req.scope.resolve("tenant") as unknown as any;
    const tenant = await tenantModule.resolveTenant({ slug, domain, handle });

    if (!tenant) {
      return res.status(404).json({ message: "Tenant not found" });
    }

    return res.json({
      tenant: {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        handle: tenant.handle,
        domain: tenant.domain,
        residency_zone: tenant.residency_zone,
        default_locale: tenant.default_locale,
        supported_locales: tenant.supported_locales,
        default_currency: tenant.default_currency,
        timezone: tenant.timezone,
        logo_url: tenant.logo_url,
        favicon_url: tenant.favicon_url,
        primary_color: tenant.primary_color,
        accent_color: tenant.accent_color,
        font_family: tenant.font_family,
        branding: tenant.branding,
        status: tenant.status,
      },
    });
  } catch (error: unknown) {
    return handleApiError(res, error, "STORE-CITYOS-TENANT");
  }
}
