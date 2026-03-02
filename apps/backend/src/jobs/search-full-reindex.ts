import type { MedusaContainer } from "@medusajs/framework";
import { SEARCH_MODULE } from "../modules/search";
import type SearchModuleService from "../modules/search/service";
import { createLogger } from "../lib/logger";

const logger = createLogger("job:search-full-reindex");

export default async function searchFullReindex(container: MedusaContainer) {
  const searchService: SearchModuleService = container.resolve(SEARCH_MODULE);

  try {
    const productModule = container.resolve("product") as any;

    // List all publishable products (Medusa v2 product module)
    const [products] = (await productModule.listAndCountProducts?.(
      { status: ["published"] },
      { take: 5000 },
    )) ?? [[], 0];

    let indexed = 0,
      skipped = 0;

    for (const product of products) {
      try {
        await searchService.indexProduct({
          product: {
            id: product.id,
            title: product.title,
            handle: product.handle,
            description: product.description,
            status: product.status,
            thumbnail: product.thumbnail,
            type: product.type?.value,
            vendor_id: (product as any).vendor_id,
            node_id: (product as any).node_id,
            tenant_id: (product as any).tenant_id,
            updated_at: product.updated_at,
          },
          tenantId: (product as any).tenant_id,
          nodeId: (product as any).node_id,
        });
        indexed++;
      } catch {
        skipped++;
      }
    }

    logger.info(
      `Search full reindex complete: ${indexed} indexed, ${skipped} skipped`,
    );
  } catch (err) {
    logger.error(`Search full reindex error: ${String(err)}`);
  }
}

export const config = {
  name: "search-full-reindex",
  schedule: "0 1 * * 0", // Weekly Sunday at 1am
};
