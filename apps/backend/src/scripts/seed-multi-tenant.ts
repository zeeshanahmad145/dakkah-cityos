import { ExecArgs } from "@medusajs/framework/types";
import { Modules } from "@medusajs/framework/utils";
import { linkProductsToSalesChannelWorkflow } from "@medusajs/medusa/core-flows";
import { createLogger } from "../lib/logger"
const logger = createLogger("scripts:seed-multi-tenant")

/**
 * Seed script for multi-tenant multi-store setup
 * Creates:
 * - Uses existing Dakkah tenant
 * - 3 Stores (Saudi Traditional, Modern Fashion, Home Decor)
 * - Sales channels for each store
 * - Links products to stores via sales channels
 */
export default async function({ container }: ExecArgs) {
  logger.info("Starting multi-tenant seed...\n");
  
  const tenantModuleService = container.resolve("tenant") as any;
  const storeModuleService = container.resolve("cityosStore") as any;
  const salesChannelModule = container.resolve(Modules.SALES_CHANNEL) as any;
  const query = container.resolve("query");
  
  // Step 1: Retrieve Dakkah Tenant
  logger.info("=== STEP 1: Retrieving Dakkah Tenant ===");
  let tenant;
  try {
    const tenants = await tenantModuleService.listTenants({ handle: "dakkah" });
    const list = Array.isArray(tenants) ? tenants : [tenants].filter(Boolean);
    if (list.length > 0 && list[0]?.id) {
      tenant = list[0];
      logger.info(`Using Dakkah tenant: ${tenant.name} (ID: ${tenant.id})`);
    } else {
      const allTenants = await tenantModuleService.listTenants();
      const allList = Array.isArray(allTenants) ? allTenants : [allTenants].filter(Boolean);
      if (allList.length > 0 && allList[0]?.id) {
        tenant = allList[0];
        logger.info(`Dakkah not found, using first tenant: ${tenant.name} (ID: ${tenant.id})`);
      } else {
        logger.info("No tenants found. Run seed-complete first.");
        return;
      }
    }
  } catch (err: any) {
    logger.info(`Could not fetch tenants: ${err.message}. Aborting.`);
    return;
  }
  
  // Step 2: Create Sales Channels for each store
  logger.info("\n=== STEP 2: Creating Sales Channels ===");
  
  const saudiChannel = await salesChannelModule.createSalesChannels({
    name: "Saudi Traditional Store",
    description: "Saudi Traditional Wear & Cultural Products",
    is_disabled: false
  });
  logger.info(`Created sales channel: ${saudiChannel.name}`);
  
  const modernChannel = await salesChannelModule.createSalesChannels({
    name: "Modern Fashion Store",
    description: "Contemporary Fashion & Accessories",
    is_disabled: false
  });
  logger.info(`Created sales channel: ${modernChannel.name}`);
  
  const homeChannel = await salesChannelModule.createSalesChannels({
    name: "Home Decor Store",
    description: "Home Decor & Living Essentials",
    is_disabled: false
  });
  logger.info(`Created sales channel: ${homeChannel.name}`);
  
  // Step 3: Create Stores
  logger.info("\n=== STEP 3: Creating Stores ===");
  
  const saudiStore = await storeModuleService.createStores({
    tenant_id: tenant.id,
    handle: "saudi-traditional",
    name: "Saudi Traditional Wear",
    sales_channel_id: saudiChannel.id,
    subdomain: "saudi",
    status: "active",
    store_type: "retail",
    theme_config: {
      primary_color: "#D97706",
      secondary_color: "#92400E",
      font_family: "Inter"
    },
    seo_title: "Saudi Traditional Wear - Authentic Cultural Fashion",
    seo_description: "Discover authentic Saudi traditional wear, abayas, thobes, and cultural fashion",
    storefront_url: "https://saudi.dakkah.sa"
  });
  logger.info(`Created store: ${saudiStore.name} (subdomain: ${saudiStore.subdomain})`);
  
  const modernStore = await storeModuleService.createStores({
    tenant_id: tenant.id,
    handle: "modern-fashion",
    name: "Modern Fashion",
    sales_channel_id: modernChannel.id,
    subdomain: "modern",
    status: "active",
    store_type: "retail",
    theme_config: {
      primary_color: "#3B82F6",
      secondary_color: "#1E40AF",
      font_family: "Inter"
    },
    seo_title: "Modern Fashion - Contemporary Style & Trends",
    seo_description: "Shop the latest in contemporary fashion and accessories",
    storefront_url: "https://modern.dakkah.sa"
  });
  logger.info(`Created store: ${modernStore.name} (subdomain: ${modernStore.subdomain})`);
  
  const homeStore = await storeModuleService.createStores({
    tenant_id: tenant.id,
    handle: "home-decor",
    name: "Home Decor",
    sales_channel_id: homeChannel.id,
    subdomain: "home",
    status: "active",
    store_type: "retail",
    theme_config: {
      primary_color: "#10B981",
      secondary_color: "#047857",
      font_family: "Inter"
    },
    seo_title: "Home Decor - Transform Your Living Space",
    seo_description: "Beautiful home decor and living essentials for your space",
    storefront_url: "https://home.dakkah.sa"
  });
  logger.info(`Created store: ${homeStore.name} (subdomain: ${homeStore.subdomain})`);
  
  // Step 4: Link Products to Stores via Sales Channels
  logger.info("\n=== STEP 4: Linking Products to Stores ===");
  
  // Get products by category/collection
  const products = await query.graph({
    entity: "product",
    fields: ["id", "title", "collection_id", "tags.*"],
  });
  
  logger.info(`Found ${products.data.length} products to distribute`);
  
  // Collect products for each channel
  const saudiProducts: string[] = [];
  const modernProducts: string[] = [];
  const homeProducts: string[] = [];
  
  // Distribute products to stores based on tags/collections
  for (const product of products.data) {
    const productTitle = (product.title || "").toLowerCase();
    const tags = product.tags?.map((t: any) => t.value?.toLowerCase() || "") || [];
    
    // Saudi Traditional Store: traditional wear, abayas, cultural items
    if (
      tags.some((t: string) => t.includes("traditional") || t.includes("saudi") || t.includes("cultural")) ||
      productTitle.includes("abaya") ||
      productTitle.includes("thobe") ||
      productTitle.includes("traditional")
    ) {
      saudiProducts.push(product.id);
      logger.info(`  - Will link "${product.title}" to Saudi Traditional Store`);
    }
    
    // Modern Fashion Store: contemporary fashion
    if (
      tags.some((t: string) => t.includes("modern") || t.includes("fashion") || t.includes("contemporary")) ||
      productTitle.includes("dress") ||
      productTitle.includes("shirt") ||
      productTitle.includes("casual")
    ) {
      modernProducts.push(product.id);
      logger.info(`  - Will link "${product.title}" to Modern Fashion Store`);
    }
    
    // Home Decor Store: home items, decor
    if (
      tags.some((t: string) => t.includes("home") || t.includes("decor") || t.includes("living")) ||
      productTitle.includes("lamp") ||
      productTitle.includes("vase") ||
      productTitle.includes("cushion") ||
      productTitle.includes("decor")
    ) {
      homeProducts.push(product.id);
      logger.info(`  - Will link "${product.title}" to Home Decor Store`);
    }
  }

  // Link products using workflow
  if (saudiProducts.length > 0) {
    await linkProductsToSalesChannelWorkflow(container).run({
      input: { id: saudiChannel.id, add: saudiProducts }
    });
    logger.info(`Linked ${saudiProducts.length} products to Saudi Traditional Store`);
  }

  if (modernProducts.length > 0) {
    await linkProductsToSalesChannelWorkflow(container).run({
      input: { id: modernChannel.id, add: modernProducts }
    });
    logger.info(`Linked ${modernProducts.length} products to Modern Fashion Store`);
  }

  if (homeProducts.length > 0) {
    await linkProductsToSalesChannelWorkflow(container).run({
      input: { id: homeChannel.id, add: homeProducts }
    });
    logger.info(`Linked ${homeProducts.length} products to Home Decor Store`);
  }
  
  // Summary
  logger.info("\n=== SEED COMPLETE ===");
  logger.info(`Tenant: ${tenant.name}`);
  logger.info(`Stores: 3`);
  logger.info(`  - Saudi Traditional (${saudiStore.subdomain}.dakkah.sa)`);
  logger.info(`  - Modern Fashion (${modernStore.subdomain}.dakkah.sa)`);
  logger.info(`  - Home Decor (${homeStore.subdomain}.dakkah.sa)`);
  logger.info(`Sales Channels: 3`);
  logger.info(`Products distributed across stores based on categories`);
}
