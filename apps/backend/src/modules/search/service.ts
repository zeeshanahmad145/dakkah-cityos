import { MedusaService } from "@medusajs/framework/utils";
import {
  SearchIndexConfig,
  SearchExclusionRule,
} from "./models/search-index-config";
import { createLogger } from "../../lib/logger";

const logger = createLogger("module:search");

const MEILISEARCH_URL = process.env.MEILISEARCH_URL ?? "http://localhost:7700";
const MEILISEARCH_KEY = process.env.MEILISEARCH_MASTER_KEY ?? "";

class SearchModuleService extends MedusaService({
  SearchIndexConfig,
  SearchExclusionRule,
}) {
  /**
   * Index a product into the correct tenant/node indexes.
   */
  async indexProduct(params: {
    product: Record<string, any>;
    tenantId?: string;
    nodeId?: string;
  }): Promise<void> {
    const { product, tenantId, nodeId } = params;

    // Check exclusion rules
    const excluded = await this.isExcluded(product.id, "product", nodeId);
    if (excluded) {
      logger.info(
        `Product ${product.id} excluded from search index (node: ${nodeId})`,
      );
      return;
    }

    const configs = (await this.listSearchIndexConfigs({
      tenant_id: tenantId ?? null,
      is_active: true,
    })) as any[];

    for (const config of configs) {
      await this.pushToIndex(config.index_name, product, config.provider);
    }
  }

  /**
   * Remove a product from all search indexes.
   */
  async removeFromIndex(productId: string, tenantId?: string): Promise<void> {
    const configs = (await this.listSearchIndexConfigs({
      tenant_id: tenantId ?? null,
      is_active: true,
    })) as any[];
    for (const config of configs) {
      await this.deleteFromIndex(config.index_name, productId, config.provider);
    }
  }

  /**
   * Check if a product/category should be excluded for a given node.
   */
  async isExcluded(
    entityId: string,
    appliesTo: string,
    nodeId?: string,
  ): Promise<boolean> {
    if (!nodeId) return false;
    const rules = (await this.listSearchExclusionRules({
      node_id: nodeId,
      applies_to: appliesTo,
      applies_to_id: entityId,
      is_active: true,
    })) as any[];
    return rules.length > 0;
  }

  private async pushToIndex(
    indexName: string,
    document: any,
    provider = "meilisearch",
  ): Promise<void> {
    if (provider !== "meilisearch" || !MEILISEARCH_URL) return;

    try {
      await fetch(`${MEILISEARCH_URL}/indexes/${indexName}/documents`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(MEILISEARCH_KEY
            ? { Authorization: `Bearer ${MEILISEARCH_KEY}` }
            : {}),
        },
        body: JSON.stringify([document]),
      });
    } catch (err) {
      logger.error(`Meilisearch index error for ${indexName}: ${String(err)}`);
    }
  }

  private async deleteFromIndex(
    indexName: string,
    documentId: string,
    provider = "meilisearch",
  ): Promise<void> {
    if (provider !== "meilisearch" || !MEILISEARCH_URL) return;
    try {
      await fetch(
        `${MEILISEARCH_URL}/indexes/${indexName}/documents/${documentId}`,
        {
          method: "DELETE",
          headers: MEILISEARCH_KEY
            ? { Authorization: `Bearer ${MEILISEARCH_KEY}` }
            : {},
        },
      );
    } catch (err) {
      logger.error(`Meilisearch delete error: ${String(err)}`);
    }
  }
}

export default SearchModuleService;
