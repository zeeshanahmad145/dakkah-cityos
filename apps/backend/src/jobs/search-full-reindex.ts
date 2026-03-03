import type { MedusaContainer } from "@medusajs/framework";
import { SEARCH_MODULE } from "../modules/search";
import type SearchModuleService from "../modules/search/service";
import { createLogger } from "../lib/logger";

const logger = createLogger("job:search-full-reindex");

export default async function searchFullReindex(container: MedusaContainer) {
  const searchService: SearchModuleService = container.resolve(SEARCH_MODULE);

  try {
    const productModule = container.resolve("product") as any;
    const kernelModule = container.resolve("kernel") as any;

    // ── 1. Index products with ABAC filter fields ──────────────────────────
    const [products] = (await productModule.listAndCountProducts?.(
      { status: ["published"] },
      { take: 5000 },
    )) ?? [[], 0];

    let indexed = 0,
      skipped = 0;

    for (const product of products) {
      try {
        // Resolve ABAC filter fields from product metadata or tags
        const requiredEntitlement =
          (product as any).metadata?.required_entitlement ?? null;
        const allowedPricingTiers =
          (product as any).metadata?.allowed_pricing_tiers ?? null;

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
            // ── ABAC filterability fields ──────────────────────────────────
            // required_entitlement: null = public, or e.g. "gov_service_access"
            required_entitlement: requiredEntitlement,
            // allowed_pricing_tiers: null = all tiers, or e.g. "government"
            allowed_pricing_tiers: allowedPricingTiers,
          },
          tenantId: (product as any).tenant_id,
          nodeId: (product as any).node_id,
        });
        indexed++;
      } catch {
        skipped++;
      }
    }

    logger.info(`Product reindex: ${indexed} indexed, ${skipped} skipped`);

    // ── 2. Index kernel Offers in 'offers' index ───────────────────────────
    // Enables OfferResolver + ABAC-filtered offer discovery across all verticals
    const MEILISEARCH_URL =
      process.env.MEILISEARCH_URL ?? "http://localhost:7700";
    const MEILISEARCH_KEY = process.env.MEILISEARCH_MASTER_KEY ?? "";

    // Ensure offers index has correct filterable attributes
    await _ensureOffersIndex(MEILISEARCH_URL, MEILISEARCH_KEY);

    if (kernelModule?.listOffers) {
      const offers = (await kernelModule.listOffers(
        { is_active: true },
        { take: 5000 },
      )) as any[];
      let offersIndexed = 0;

      for (const offer of offers) {
        try {
          const doc = {
            id: offer.id,
            offer_type: offer.offer_type,
            monetization_model: offer.monetization_model,
            execution_engine: offer.execution_engine,
            source_module: offer.source_module,
            source_entity_id: offer.source_entity_id,
            title: offer.title ?? offer.source_entity_id,
            base_price: offer.base_price,
            currency_code: offer.currency_code,
            tenant_id: offer.tenant_id,
            node_id: offer.node_id,
            // ── ABAC filterability fields ──────────────────────────────────
            required_entitlement: offer.metadata?.required_entitlement ?? null,
            allowed_pricing_tiers:
              offer.metadata?.allowed_pricing_tiers ?? null,
          };

          await fetch(`${MEILISEARCH_URL}/indexes/offers/documents`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...(MEILISEARCH_KEY
                ? { Authorization: `Bearer ${MEILISEARCH_KEY}` }
                : {}),
            },
            body: JSON.stringify([doc]),
          });
          offersIndexed++;
        } catch {
          /* skip */
        }
      }
      logger.info(`Offer reindex: ${offersIndexed} offers indexed`);
    }

    logger.info("Search full reindex complete");
  } catch (err) {
    logger.error(`Search full reindex error: ${String(err)}`);
  }
}

/**
 * Create the 'offers' index with correct filterable + sortable attributes.
 * This makes ABAC filter fields available in Meilisearch query time.
 */
async function _ensureOffersIndex(
  meiliUrl: string,
  meiliKey: string,
): Promise<void> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(meiliKey ? { Authorization: `Bearer ${meiliKey}` } : {}),
  };

  // Create index if it doesn't exist
  await fetch(`${meiliUrl}/indexes`, {
    method: "POST",
    headers,
    body: JSON.stringify({ uid: "offers", primaryKey: "id" }),
  }).catch(() => {
    /* already exists */
  });

  // Set filterable attributes — CRITICAL for ABAC filtering to work
  await fetch(`${meiliUrl}/indexes/offers/settings/filterable-attributes`, {
    method: "PUT",
    headers,
    body: JSON.stringify([
      "required_entitlement",
      "allowed_pricing_tiers",
      "offer_type",
      "monetization_model",
      "execution_engine",
      "tenant_id",
      "node_id",
      "is_active",
    ]),
  });

  // Set filterable attributes on products index too
  await fetch(`${meiliUrl}/indexes/products/settings/filterable-attributes`, {
    method: "PUT",
    headers,
    body: JSON.stringify([
      "required_entitlement",
      "allowed_pricing_tiers",
      "node_id",
      "tenant_id",
      "vendor_id",
      "status",
      "type",
    ]),
  });
}

export const config = {
  name: "search-full-reindex",
  schedule: "0 1 * * 0", // Weekly Sunday at 1am
};
