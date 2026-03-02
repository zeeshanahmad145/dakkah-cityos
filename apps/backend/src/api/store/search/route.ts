import type { MedusaRequest, MedusaResponse } from "@medusajs/framework";
import { SEARCH_MODULE } from "../../../modules/search";
import type SearchModuleService from "../../../modules/search/service";

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
          filter: node_id ? `node_id = "${node_id}"` : undefined,
        }),
      },
    );

    const result = (await searchRes.json()) as any;
    res.json({
      hits: result.hits ?? [],
      total: result.estimatedTotalHits ?? 0,
      facet_distribution: result.facetDistribution ?? {},
      query: q,
    });
  } catch {
    res.status(500).json({ hits: [], total: 0, error: "Search unavailable" });
  }
}
