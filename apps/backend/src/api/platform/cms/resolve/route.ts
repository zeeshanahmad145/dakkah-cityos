import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { resolveLocalCMSPage } from "../../../../lib/platform/cms-registry";
import { handleApiError } from "../../../../lib/api-error-handler";
import { appConfig } from "../../../../lib/config";

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const { path, tenant, locale, tenant_id, countryCode, country_code } =
      req.query as Record<string, string>;

    if (!path) {
      return res.status(400).json({
        success: false,
        error: "Missing required query parameter: path",
        errors: [{ message: "Missing required query parameter: path" }],
      });
    }

    const resolvedCountryCode = countryCode || country_code || undefined;
    const resolvedTenantId = tenant_id || (await resolveTenantId(req, tenant));

    const localPage = resolveLocalCMSPage(
      path,
      resolvedTenantId,
      locale,
      resolvedCountryCode,
    );
    if (localPage) {
      const payloadShape = {
        docs: [localPage],
        totalDocs: 1,
        limit: 1,
        page: 1,
        totalPages: 1,
        hasNextPage: false,
        hasPrevPage: false,
        pagingCounter: 1,
        prevPage: null,
        nextPage: null,
      };

      res.setHeader("Cache-Control", "public, max-age=30, s-maxage=120");
      return res.status(200).json({
        success: true,
        data: {
          page: localPage,
          resolved: true,
          source: "local-registry",
          tenantId: resolvedTenantId,
          path,
          locale: locale || null,
          countryCode: resolvedCountryCode || null,
        },
        payload: payloadShape,
      });
    }

    const payloadUrl = appConfig.payloadCms.url;

    const where: Record<string, any> = {
      path: { equals: path },
      _status: { equals: "published" },
    };

    if (resolvedTenantId) {
      where.tenant = { equals: resolvedTenantId };
    }

    if (locale) {
      where.locale = { in: [locale, "all"] };
    }

    if (resolvedCountryCode) {
      where.countryCode = { equals: resolvedCountryCode };
    }

    const query = new URLSearchParams({
      where: JSON.stringify(where),
      limit: "1",
      depth: "2",
    });

    try {
      const payloadApiKey = appConfig.payloadCms.apiKey;
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (payloadApiKey) {
        headers["Authorization"] = `Bearer ${payloadApiKey}`;
      }

      const response = await fetch(`${payloadUrl}/api/pages?${query}`, {
        headers,
      });

      if (!response.ok) {
        const emptyPayload = {
          docs: [],
          totalDocs: 0,
          limit: 1,
          page: 1,
          totalPages: 0,
          hasNextPage: false,
          hasPrevPage: false,
          pagingCounter: 1,
          prevPage: null,
          nextPage: null,
        };

        return res.status(200).json({
          success: true,
          data: {
            page: null,
            resolved: false,
            source: "payload",
            error: `Payload returned ${response.status}`,
            tenantId: resolvedTenantId,
            path,
          },
          payload: emptyPayload,
        });
      }

      const data = await response.json();
      const page = data.docs?.[0] || null;

      const payloadShape = page
        ? {
            docs: [page],
            totalDocs: 1,
            limit: 1,
            page: 1,
            totalPages: 1,
            hasNextPage: false,
            hasPrevPage: false,
            pagingCounter: 1,
            prevPage: null,
            nextPage: null,
          }
        : {
            docs: [],
            totalDocs: 0,
            limit: 1,
            page: 1,
            totalPages: 0,
            hasNextPage: false,
            hasPrevPage: false,
            pagingCounter: 1,
            prevPage: null,
            nextPage: null,
          };

      res.setHeader("Cache-Control", "public, max-age=30, s-maxage=120");

      return res.status(200).json({
        success: true,
        data: {
          page,
          resolved: !!page,
          source: "payload",
          tenantId: resolvedTenantId,
          path,
          locale: locale || null,
          countryCode: resolvedCountryCode || null,
        },
        payload: payloadShape,
      });
    } catch (fetchError) {
      const emptyPayload = {
        docs: [],
        totalDocs: 0,
        limit: 1,
        page: 1,
        totalPages: 0,
        hasNextPage: false,
        hasPrevPage: false,
        pagingCounter: 1,
        prevPage: null,
        nextPage: null,
      };

      return res.status(200).json({
        success: true,
        data: {
          page: null,
          resolved: false,
          source: "payload",
          error: "Payload CMS unavailable",
          tenantId: resolvedTenantId,
          path,
        },
        payload: emptyPayload,
      });
    }
  } catch (error: unknown) {
    return handleApiError(res, error, "PLATFORM-CMS-RESOLVE");
  }
}

async function resolveTenantId(
  req: MedusaRequest,
  tenantSlug?: string,
): Promise<string> {
  const DEFAULT_TENANT_ID = "01KGZ2JRYX607FWMMYQNQRKVWS";

  if (!tenantSlug || tenantSlug === "dakkah") {
    return DEFAULT_TENANT_ID;
  }

  try {
    const tenantService = req.scope.resolve("tenantModuleService") as unknown as any;
    if (tenantService?.listTenants) {
      const [tenants] = await tenantService.listTenants({ slug: tenantSlug });
      if (tenants?.length > 0) {
        return tenants[0].id;
      }
    }
  } catch {}

  return DEFAULT_TENANT_ID;
}
