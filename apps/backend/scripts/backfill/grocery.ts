/**
 * Backfill: Grocery → Medusa Product
 *
 * For every existing FreshProduct that has no Medusa Product link,
 * this script:
 *   1. Creates a Medusa Product from legacy fields stored in metadata
 *   2. Creates a variant with the price from metadata
 *   3. Creates the product ↔ fresh_product link via remoteLink.create()
 *
 * Run with:
 *   npx ts-node -r tsconfig-paths/register scripts/backfill/grocery.ts
 *
 * SAFE TO RUN MULTIPLE TIMES — skips rows that already have a link.
 */

import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";
import { GROCERY_MODULE } from "../../src/modules/grocery";

async function run() {
  // Bootstrap Medusa app
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const app = require("@medusajs/medusa");
  const container = (app as any).container ?? (app as any).default?.container;

  const productService = container.resolve(Modules.PRODUCT);
  const groceryService = container.resolve(GROCERY_MODULE) as any;
  const remoteLink = container.resolve(ContainerRegistrationKeys.REMOTE_LINK);
  const remoteQuery = container.resolve(ContainerRegistrationKeys.REMOTE_QUERY);

  // Fetch all fresh products
  const freshProducts = await groceryService.listFreshProducts(
    {},
    { take: 1000 },
  );
  console.log(`Found ${freshProducts.length} FreshProducts to check`);

  let created = 0;
  let skipped = 0;

  for (const fp of freshProducts) {
    // Check if already linked
    const existingLink = await remoteQuery({
      entryPoint: "grocery",
      fields: ["fresh_product.id", "product.id"],
      variables: { filters: { id: fp.id } },
    }).catch(() => null);

    if (existingLink?.[0]?.product?.id) {
      skipped++;
      continue;
    }

    // Recover legacy data from metadata if available
    const meta = (fp.metadata as Record<string, any>) ?? {};
    const title = meta.title ?? `Grocery Item (${fp.id})`;
    const price = meta.price ? Number(meta.price) * 100 : 0;
    const currency = meta.currency_code ?? "sar";
    const thumbnail = meta.thumbnail ?? null;

    // Create Medusa product
    const [product] = await productService.createProducts([
      {
        title,
        description: meta.description ?? null,
        status: "published" as const,
        images: thumbnail ? [{ url: thumbnail }] : [],
        variants: [
          {
            title: fp.unit_type,
            prices: [{ amount: price, currency_code: currency }],
          },
        ],
        metadata: {
          vertical: "grocery",
          tenant_id: fp.tenant_id,
          backfilled_from: fp.id,
        },
      },
    ]);

    // Create link
    await remoteLink.create({
      [Modules.PRODUCT]: { product_id: product.id },
      [GROCERY_MODULE]: { fresh_product_id: fp.id },
    });

    created++;
    console.log(
      `✅ Linked FreshProduct ${fp.id} → Product ${product.id} (${title})`,
    );
  }

  console.log(
    `\nDone. Created: ${created}, Skipped (already linked): ${skipped}`,
  );
  process.exit(0);
}

run().catch((err) => {
  console.error("Backfill failed:", err);
  process.exit(1);
});
