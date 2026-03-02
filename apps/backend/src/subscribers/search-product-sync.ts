import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework";
import { SEARCH_MODULE } from "../modules/search";
import type SearchModuleService from "../modules/search/service";
import { createLogger } from "../lib/logger";

const logger = createLogger("subscriber:search-product-sync");

export default async function searchProductSync({
  event,
  container,
}: SubscriberArgs<{
  id: string;
  node_id?: string;
  tenant_id?: string;
  [key: string]: any;
}>) {
  const searchService: SearchModuleService = container.resolve(SEARCH_MODULE);
  const d = event.data;

  try {
    if (event.name === "product.deleted") {
      await searchService.removeFromIndex(d.id, d.tenant_id);
      logger.info(`Removed product ${d.id} from search index`);
      return;
    }

    // Build a search document from the product data
    const doc = {
      id: d.id,
      title: d.title,
      handle: d.handle,
      description: d.description,
      status: d.status,
      thumbnail: d.thumbnail,
      vendor_id: d.vendor_id,
      node_id: d.node_id,
      tenant_id: d.tenant_id,
      tags: d.tags?.map((t: any) => t.value),
      categories: d.categories?.map((c: any) => c.name),
      type: d.type?.value,
      price_from: d.variants?.[0]?.calculated_price ?? null,
      updated_at: d.updated_at,
    };

    await searchService.indexProduct({
      product: doc,
      tenantId: d.tenant_id,
      nodeId: d.node_id,
    });
    logger.info(`Indexed product ${d.id} (event: ${event.name})`);
  } catch (err) {
    logger.error(`Search sync error for product ${d.id}: ${String(err)}`);
  }
}

export const config: SubscriberConfig = {
  event: ["product.created", "product.updated", "product.deleted"],
};
