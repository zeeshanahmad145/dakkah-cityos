import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { handleApiError } from "../../../../lib/api-error-handler";

/**
 * GET /store/content/:slug
 * Fetch a published CMS page by URL slug for storefront rendering.
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const cmsContentService = req.scope.resolve("cmsContent") as unknown as any;
    const slug = req.params.slug;
    const { locale } = req.query as { locale?: string };

    if (!slug) {
      return res.status(400).json({ error: "slug is required" });
    }

    const pages = await cmsContentService.listCmsPages({ slug }, { take: 1 });
    const list = Array.isArray(pages) ? pages : [pages].filter(Boolean);
    const page = list[0] ?? null;

    if (!page) {
      return res
        .status(404)
        .json({ error: `No page found with slug '${slug}'` });
    }

    if (page.status !== "published") {
      return res
        .status(404)
        .json({ error: `No published page found with slug '${slug}'` });
    }

    // Return localised content if available
    const content =
      locale && page.localizations?.[locale]
        ? page.localizations[locale]
        : {
            title: page.title,
            body: page.body,
            seo: page.seo_metadata,
          };

    return res.json({
      page: {
        id: page.id,
        slug,
        locale: locale ?? page.default_locale ?? "en",
        ...content,
        published_at: page.published_at,
        updated_at: page.updated_at,
      },
    });
  } catch (error: unknown) {
    return handleApiError(res, error, "STORE-CONTENT-SLUG");
  }
}
