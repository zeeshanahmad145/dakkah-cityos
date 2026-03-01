/**
 * Backfill: Freelance GigListings → Medusa Products
 *
 * For every existing GigListing that has no Medusa Product link,
 * this script creates a Medusa Product and links it.
 *
 * Run with:
 *   npx ts-node -r tsconfig-paths/register scripts/backfill/freelance.ts
 *
 * SAFE TO RUN MULTIPLE TIMES — skips rows that already have a link.
 */

import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";
import { FREELANCE_MODULE } from "../../src/modules/freelance";

async function run() {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const app = require("@medusajs/medusa");
  const container = (app as any).container ?? (app as any).default?.container;

  const productService = container.resolve(Modules.PRODUCT);
  const freelanceService = container.resolve(FREELANCE_MODULE) as any;
  const remoteLink = container.resolve(ContainerRegistrationKeys.REMOTE_LINK);

  const gigListings = await freelanceService.listGigListings(
    {},
    { take: 1000 },
  );
  console.log(`Found ${gigListings.length} GigListings to check`);

  let created = 0;
  let skipped = 0;

  for (const gig of gigListings) {
    const meta = (gig.metadata as Record<string, any>) ?? {};

    // Skip if already has a link (check metadata marker)
    if (meta.product_id) {
      skipped++;
      continue;
    }

    const title = meta.title ?? `Freelance Gig (${gig.id})`;
    const priceAmount =
      gig.listing_type === "hourly"
        ? Number(meta.hourly_rate ?? 0) * 100
        : Number(meta.price ?? 0) * 100;
    const currency = meta.currency_code ?? "sar";

    const [product] = await productService.createProducts([
      {
        title,
        description: meta.description ?? null,
        type: { value: "freelance-gig" },
        status: "published" as const,
        variants: [
          {
            title: gig.listing_type === "hourly" ? "Per Hour" : "Fixed Price",
            prices: [{ amount: priceAmount, currency_code: currency }],
          },
        ],
        metadata: {
          vertical: "freelance",
          listing_type: gig.listing_type,
          tenant_id: gig.tenant_id,
          freelancer_id: gig.freelancer_id,
          backfilled_from: gig.id,
        },
      },
    ]);

    await remoteLink.create({
      [Modules.PRODUCT]: { product_id: product.id },
      [FREELANCE_MODULE]: { gig_listing_id: gig.id },
    });

    created++;
    console.log(
      `✅ Linked GigListing ${gig.id} → Product ${product.id} (${title})`,
    );
  }

  console.log(`\nDone. Created: ${created}, Skipped: ${skipped}`);
  process.exit(0);
}

run().catch((err) => {
  console.error("Backfill failed:", err);
  process.exit(1);
});
