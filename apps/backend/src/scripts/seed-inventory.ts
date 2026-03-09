// @ts-nocheck
import { ExecArgs } from "@medusajs/framework/types";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";

/**
 * This script adds stock to all existing product variants in your Medusa store.
 * Run this with: npx medusa exec ./src/scripts/seed-inventory.ts
 */
export default async function seedInventory({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const query = container.resolve(ContainerRegistrationKeys.QUERY);
  const inventoryModuleService = container.resolve(Modules.INVENTORY);
  const stockLocationModuleService = container.resolve(Modules.STOCK_LOCATION);
  const productModuleService = container.resolve(Modules.PRODUCT);

  logger.info("========================================");
  logger.info("Starting Inventory Seed");
  logger.info("========================================");

  // 1. Get the first available stock location
  const [locations] = await stockLocationModuleService.listAndCountStockLocations({});
  if (!locations || locations.length === 0) {
    logger.warn("No stock locations found. Please create a stock location first in the admin panel or run 'npm run seed'.");
    return;
  }
  const stockLocation = locations[0];
  logger.info(`Using stock location: ${stockLocation.name} (${stockLocation.id})`);

  // 2. Fetch all product variants
  logger.info("Fetching product variants...");
  const { data: variants } = await query.graph({
    entity: "variant",
    fields: ["id", "title", "sku", "manage_inventory", "product.title"],
  });

  if (!variants || variants.length === 0) {
    logger.info("No product variants found to add stock to.");
    return;
  }

  logger.info(`Found ${variants.length} variants. Enabling manage_inventory and updating stock...`);

  let addedStockCount = 0;

  for (const variant of variants) {
    try {
      // 3. Ensure "manage_inventory" is enabled for the variant
      if (!variant.manage_inventory) {
        // In Medusa v2, you can't just set manage_inventory: true via productModuleService.update()
        // The inventory item is automatically created during variant creation if manage_inventory is true.
        // If not, we have to manually create the inventory item & link it, which step 4 does anyway.
        logger.info(`  Variant ${variant.sku || variant.title} is not managing inventory. Moving to create manual item.`);
      }

      // 4. Find the linked inventory item for this variant
      // When manage_inventory is true, Medusa automatically creates an inventory item behind the scenes.
      const { data: inventoryItems } = await query.graph({
        entity: "inventory_item",
        fields: ["id", "sku"],
        filters: { q: variant.sku || variant.id }, // Fallback to ID if SKU is missing
      });

      let inventoryItemId = null;

      if (inventoryItems && inventoryItems.length > 0) {
        inventoryItemId = inventoryItems[0].id;
      } else {
        // If an inventory item doesn't exist, create one manually
        const createdItem = await inventoryModuleService.createInventoryItems({
          sku: variant.sku || `sku-${variant.id}`,
          title: `${variant.product?.title} - ${variant.title}`,
          requires_shipping: true,
        });
        inventoryItemId = createdItem.id;

         // Link the inventory item to the product variant
         const remoteLink = container.resolve("remoteLink");
         await remoteLink.create({
            [Modules.PRODUCT]: {
                variant_id: variant.id
            },
            [Modules.INVENTORY]: {
                inventory_item_id: inventoryItemId
            }
         });
         logger.info(`  Created new inventory item for ${variant.sku || variant.title}`);
      }

      // 5. Check if the inventory item is linked to our stock location
      const [levels] = await inventoryModuleService.listAndCountInventoryLevels({
        inventory_item_id: inventoryItemId,
        location_id: stockLocation.id,
      });

      // 6. Set the Stock Quantity (e.g. 100 items each)
      const STOCK_AMOUNT = 100;

      if (levels && levels.length > 0) {
        // Update existing stock level
        await inventoryModuleService.updateInventoryLevels([
          {
            inventory_item_id: inventoryItemId,
            location_id: stockLocation.id,
            stocked_quantity: STOCK_AMOUNT,
          }
        ]);
      } else {
        // Create new stock level for this location
        await inventoryModuleService.createInventoryLevels([
          {
            inventory_item_id: inventoryItemId,
            location_id: stockLocation.id,
            stocked_quantity: STOCK_AMOUNT,
          }
        ]);
      }

      logger.info(`  Added ${STOCK_AMOUNT} stock to ${variant.product?.title} - ${variant.title} (${variant.sku || variant.id})`);
      addedStockCount++;

    } catch (err: any) {
      logger.error(`Failed to add stock for variant ${variant.id}: ${err.message}`);
    }
  }

  logger.info("========================================");
  logger.info(`Successfully added stock to ${addedStockCount} variants!`);
  logger.info("========================================");
}
