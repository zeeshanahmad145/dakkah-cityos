import { model } from "@medusajs/framework/utils";

/**
 * SearchIndexConfig — per-tenant/node search index configuration.
 */
const SearchIndexConfig = model.define("search_index_config", {
  id: model.id().primaryKey(),
  tenant_id: model.text().nullable(),
  node_id: model.text().nullable(),
  // provider: meilisearch|algolia|elasticsearch|typesense
  provider: model.text().default("meilisearch"),
  index_name: model.text(),
  // Facet fields applied to the index (JSON array of strings)
  facet_fields: model.json(),
  // Ranking rules (JSON array)
  ranking_rules: model.json().nullable(),
  searchable_attributes: model.json().nullable(),
  last_synced_at: model.dateTime().nullable(),
  is_active: model.boolean().default(true),
});

/**
 * SearchExclusionRule — catalog visibility enforced at indexing time.
 */
const SearchExclusionRule = model.define("search_exclusion_rule", {
  id: model.id().primaryKey(),
  node_id: model.text().nullable(),
  // applies_to: product|category|product_type
  applies_to: model.text(),
  applies_to_id: model.text(),
  reason: model.text().nullable(),
  is_active: model.boolean().default(true),
});

export { SearchIndexConfig, SearchExclusionRule };
