import type { MedusaRequest, MedusaResponse } from "@medusajs/framework";
import { SEARCH_MODULE } from "../../../modules/search";
import type SearchModuleService from "../../../modules/search/service";
import type { ABACAttributes } from "../../../lib/abac-engine";

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const {
    q = "",
    node_id,
    tenant_id,
    facets,
    limit = "20",
  } = req.query as Record<string, string>;

  if (!q.trim()) {
    return res.json({ hits: [], total: 0, query: q });
  }

  const searchService: SearchModuleService = req.scope.resolve(SEARCH_MODULE);

  try {
    const configs = (await searchService.listSearchIndexConfigs({
      tenant_id: tenant_id ?? null,
      is_active: true,
    })) as any[];

    if (configs.length === 0) {
      return res.json({
        hits: [],
        total: 0,
        query: q,
        note: "No search index configured",
      });
    }

    const config =
      configs.find((c: any) => !node_id || c.node_id === node_id) ?? configs[0];
    const MEILISEARCH_URL =
      process.env.MEILISEARCH_URL ?? "http://localhost:7700";
    const MEILISEARCH_KEY = process.env.MEILISEARCH_MASTER_KEY ?? "";

    const searchRes = await fetch(
      `${MEILISEARCH_URL}/indexes/${config.index_name}/search`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(MEILISEARCH_KEY
            ? { Authorization: `Bearer ${MEILISEARCH_KEY}` }
            : {}),
        },
        body: JSON.stringify({
          q,
          limit: Math.min(Number(limit), 100),
          facets: facets ? facets.split(",") : config.facet_fields,
          filter: _buildSearchFilter(node_id, (req as any).abac_attributes),
        }),
      },
    );

    const result = (await searchRes.json()) as any;
    res.json({
      hits: result.hits ?? [],
      total: result.estimatedTotalHits ?? 0,
      facet_distribution: result.facetDistribution ?? {},
      query: q,
      abac_applied: !!(req as any).abac_attributes,
    });
  } catch {
    res.json({ hits: [], total: 0, query: q, note: "Search unavailable" });
  }
}

/**
 * Build a Meilisearch filter string incorporating ABAC entitlement restrictions.
 * Public offers are always visible. Entitlement-gated offers only surface
 * when the customer's resolved ABAC attributes include the required entitlement.
 *
 * Documents in the index must have these fields set at index time:
 *   required_entitlement: null (public) | string (e.g. "gov_service_access")
 *   allowed_pricing_tiers: null (all) | string[] (e.g. ["government", "standard"])
 */
function _buildSearchFilter(
  nodeId: string | undefined,
  abac: ABACAttributes | undefined,
): string | undefined {
  const filters: string[] = [];

  // Node filter
  if (nodeId) filters.push(`node_id = "${nodeId}"`);

  // ABAC entitlement filter
  if (abac) {
    const customerEntitlements = ["public", ...abac.entitlements];
    const pricingTier = abac.pricing_tier ?? "standard";

    // Only show docs where required_entitlement is null OR in customer's entitlements
    const entitlementFilter = `(required_entitlement IS NULL OR required_entitlement IN [${customerEntitlements.map((e) => `"${e}"`).join(", ")}])`;
    filters.push(entitlementFilter);

    // Only show docs where allowed_pricing_tiers is null OR includes customer tier
    const tierFilter = `(allowed_pricing_tiers IS NULL OR allowed_pricing_tiers = "${pricingTier}" OR allowed_pricing_tiers = "standard")`;
    filters.push(tierFilter);
  } else {
    // No VC — only public content
    filters.push(`(required_entitlement IS NULL)`);
  }

  return filters.length > 0 ? filters.join(" AND ") : undefined;
}
