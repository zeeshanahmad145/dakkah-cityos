// @ts-nocheck
import { ExecArgs } from "@medusajs/framework/types";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";

export default async function seedInventorySafe({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const query = container.resolve(ContainerRegistrationKeys.QUERY);
  const inventoryModuleService = container.resolve(Modules.INVENTORY);
  const stockLocationModuleService = container.resolve(Modules.STOCK_LOCATION);
  const remoteLink = container.resolve("remoteLink");

  logger.info("========================================");
  logger.info("Starting SAFE Inventory Seed");
  logger.info("(Only adds stock to variants with NO existing inventory)");
  logger.info("========================================");

  // 1. Get the first available stock location
  const [locations] = await stockLocationModuleService.listAndCountStockLocations({});
  if (!locations || locations.length === 0) {
    logger.warn("No stock locations found. Please create a stock location first.");
    return;
  }
  const stockLocation = locations[0];
  logger.info(`Using stock location: ${stockLocation.name} (${stockLocation.id})`);

  // 2. Fetch all product variants
  logger.info("Fetching product variants...");
  const { data: variants } = await query.graph({
    entity: "variant",
    fields: ["id", "title", "sku", "product.title", "product.id"],
  });

  if (!variants || variants.length === 0) {
    logger.info("No product variants found.");
    return;
  }

  logger.info(`Found ${variants.length} total variants. Checking which need inventory...`);

  let addedCount = 0;
  let skippedCount = 0;
  const STOCK_AMOUNT = 100; // Default stock for new variants

  // Process variants in batches
  const BATCH_SIZE = 25;
  for (let i = 0; i < variants.length; i += BATCH_SIZE) {
    const batch = variants.slice(i, i + BATCH_SIZE);
    
    await Promise.all(batch.map(async (variant) => {
      try {
        // Skip if no SKU
        if (!variant.sku) {
          logger.warn(`  Skipping variant ${variant.id} (${variant.title}) - No SKU defined`);
          skippedCount++;
          return;
        }

        // 3. Find the inventory item for this variant
        const { data: inventoryItems } = await query.graph({
          entity: "inventory_item",
          fields: ["id", "sku"],
          filters: { sku: variant.sku },
        });

        if (!inventoryItems || inventoryItems.length === 0) {
          logger.info(`  No inventory item found for ${variant.sku} - Creating new...`);
          
          // Create new inventory item
          const createdItem = await inventoryModuleService.createInventoryItems({
            sku: variant.sku,
            title: `${variant.product?.title || 'Product'} - ${variant.title}`,
            requires_shipping: true,
          });
          
          // Link to variant
          await remoteLink.create({
            [Modules.PRODUCT]: { variant_id: variant.id },
            [Modules.INVENTORY]: { inventory_item_id: createdItem.id }
          });

          // Create inventory level
          await inventoryModuleService.createInventoryLevels([{
            inventory_item_id: createdItem.id,
            location_id: stockLocation.id,
            stocked_quantity: STOCK_AMOUNT,
          }]);

          logger.info(`  ✅ Created inventory for ${variant.sku} with ${STOCK_AMOUNT} units`);
          addedCount++;
          return;
        }

        // 4. Check if inventory level exists at this location
        const inventoryItemId = inventoryItems[0].id;
        const [levels] = await inventoryModuleService.listAndCountInventoryLevels({
          inventory_item_id: inventoryItemId,
          location_id: stockLocation.id,
        });

        if (!levels || levels.length === 0) {
          // No level exists - create one
          await inventoryModuleService.createInventoryLevels([{
            inventory_item_id: inventoryItemId,
            location_id: stockLocation.id,
            stocked_quantity: STOCK_AMOUNT,
          }]);
          logger.info(`  ✅ Created inventory level for ${variant.sku} with ${STOCK_AMOUNT} units`);
          addedCount++;
        } else {
          // Level already exists - skip to preserve existing stock
          logger.info(`  ⏭️  Skipping ${variant.sku} - Inventory already exists (${levels[0].stocked_quantity} units)`);
          skippedCount++;
        }

      } catch (err: any) {
        logger.error(`  ❌ Error processing variant ${variant.id} (${variant.sku}): ${err.message}`);
      }
    }));
  }

  logger.info("========================================");
  logger.info("SAFE Inventory Seed Complete!");
  logger.info(`  Total variants processed: ${variants.length}`);
  logger.info(`  ✅ Added inventory to: ${addedCount} new variants`);
  logger.info(`  ⏭️  Skipped (already have inventory): ${skippedCount}`);
  logger.info(`  Default stock amount: ${STOCK_AMOUNT} units per new variant`);
  logger.info("========================================");
  logger.info("Your existing inventory levels were NOT modified!");
}