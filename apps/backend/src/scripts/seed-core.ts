// @ts-nocheck
import { ExecArgs } from "@medusajs/framework/types"
import {
  ContainerRegistrationKeys,
  Modules,
} from "@medusajs/framework/utils"
import {
  createApiKeysWorkflow,
  createRegionsWorkflow,
  createSalesChannelsWorkflow,
  createShippingOptionsWorkflow,
  createShippingProfilesWorkflow,
  createStockLocationsWorkflow,
  createProductCategoriesWorkflow,
  linkSalesChannelsToApiKeyWorkflow,
  linkSalesChannelsToStockLocationWorkflow,
  updateStoresWorkflow,
} from "@medusajs/medusa/core-flows"
const { SeedContext } = require("./seed-utils")

export default async function seedCore({ container }: ExecArgs): Promise<SeedContext> {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const link = container.resolve(ContainerRegistrationKeys.LINK)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const fulfillmentModuleService = container.resolve(Modules.FULFILLMENT)
  const salesChannelModuleService = container.resolve(Modules.SALES_CHANNEL)
  const storeModuleService = container.resolve(Modules.STORE)

  const ctx: SeedContext = {
    tenantId: "dakkah",
    storeId: "",
    salesChannelIds: [],
    regionId: "",
    apiKeyId: "",
    stockLocationId: "",
    shippingProfileId: "",
    categoryIds: {},
    productIds: [],
    customerIds: [],
    vendorIds: [],
    companyIds: [],
  }

  logger.info("========================================")
  logger.info("Starting Core Infrastructure Seed")
  logger.info("========================================\n")

  // ============================================================
// STEP 0: Create Tenant
// ============================================================
logger.info("Step 0: Creating tenant...")

try {
  const { data: existingTenants } = await query.graph({
    entity: "tenant",
    fields: ["id", "name"],
    filters: { id: ctx.tenantId },
  })

  if (!existingTenants || existingTenants.length === 0) {
    await query.create({
      entity: "tenant",
      data: {
        id: ctx.tenantId,
        name: "Dakkah",
        domain: "dakkah",
        status: "active",
      },
    })

    logger.info(`  Tenant created: ${ctx.tenantId}`)
  } else {
    logger.info(`  Tenant already exists: ${ctx.tenantId}`)
  }
} catch (error: any) {
  logger.error(`  Tenant step failed: ${error.message}`)
}


  // ============================================================
  // STEP 1: Admin User
  // ============================================================
  logger.info("Step 1: Creating admin user...")
  try {
    const { data: existingUsers } = await query.graph({
      entity: "user",
      fields: ["id", "email"],
      filters: { email: "admin@dakkah.sa" },
    })

    if (!existingUsers || existingUsers.length === 0) {
      const authModuleService = container.resolve(Modules.AUTH)
      const userModuleService = container.resolve(Modules.USER)

      const authIdentity = await authModuleService.createAuthIdentities({
        provider_identities: [
          {
            provider: "emailpass",
            entity_id: "admin@dakkah.sa",
            provider_metadata: {
              password: "admin123456",
            },
          },
        ],
      })

      const user = await userModuleService.createUsers({
        email: "admin@dakkah.sa",
        first_name: "Admin",
        last_name: "Dakkah",
      })

      await authModuleService.updateAuthIdentities({
        id: authIdentity.id,
        app_metadata: {
          user_id: user.id,
        },
      })

      logger.info("  Created admin user: admin@dakkah.sa")
    } else {
      logger.info("  Admin user already exists")
    }
  } catch (error: any) {
    logger.error(`  Admin user step failed: ${error.message}`)
  }

  // ============================================================
  // STEP 2: Store Settings
  // ============================================================
  logger.info("\nStep 2: Updating store settings...")
  try {
    const [store] = await storeModuleService.listStores()
    ctx.storeId = store.id

    const { data: pricePreferences } = await query.graph({
      entity: "price_preference",
      fields: ["id"],
    })
    if (pricePreferences.length > 0) {
      await container.resolve(Modules.PRICING).deletePricePreferences(pricePreferences.map((pp) => pp.id))
    }

    await updateStoresWorkflow(container).run({
      input: {
        selector: { id: store.id },
        update: {
          name: "Dakkah Commerce",
          supported_currencies: [
            { currency_code: "sar", is_default: true },
            { currency_code: "usd" },
            { currency_code: "aed" },
          ],
        },
      },
    })
    logger.info("  Store updated: Dakkah Commerce (SAR default)")
  } catch (error: any) {
    logger.error(`  Store settings step failed: ${error.message}`)
  }

  // ============================================================
  // STEP 3: Sales Channels
  // ============================================================
  logger.info("\nStep 3: Creating sales channels...")
  const channelConfigs = [
    { name: "Default Sales Channel", description: "Default sales channel" },
    { name: "Web Store", description: "Online web storefront" },
    { name: "Mobile App", description: "Mobile application storefront" },
  ]

  try {
    for (const cfg of channelConfigs) {
      let existing = await salesChannelModuleService.listSalesChannels({ name: cfg.name })
      if (!existing.length) {
        const { result } = await createSalesChannelsWorkflow(container).run({
          input: { salesChannelsData: [cfg] },
        })
        existing = result
        logger.info(`  Created: ${cfg.name}`)
      } else {
        logger.info(`  Exists: ${cfg.name}`)
      }
      ctx.salesChannelIds.push(existing[0].id)
    }

    await updateStoresWorkflow(container).run({
      input: {
        selector: { id: ctx.storeId },
        update: {
          default_sales_channel_id: ctx.salesChannelIds[0],
        },
      },
    })
  } catch (error: any) {
    logger.error(`  Sales channels step failed: ${error.message}`)
  }

  // ============================================================
  // STEP 4: Regions
  // ============================================================
  logger.info("\nStep 4: Creating regions...")
  try {
    const { data: existingRegions } = await query.graph({
      entity: "region",
      fields: ["id", "name"],
    })

    if (!existingRegions || existingRegions.length === 0) {
      const { result: regionResult } = await createRegionsWorkflow(container).run({
        input: {
          regions: [
            {
              name: "Saudi Arabia",
              currency_code: "sar",
              countries: ["sa", "ae", "bh", "kw", "om", "qa"],
              payment_providers: ["pp_system_default"],
              automatic_taxes: false,
              is_tax_inclusive: true,
            },
          ],
        },
      })
      ctx.regionId = regionResult[0].id
      logger.info(`  Created region: Saudi Arabia (${ctx.regionId})`)
    } else {
      const saRegion = existingRegions.find((r: any) => r.name === "Saudi Arabia")
      ctx.regionId = saRegion ? saRegion.id : existingRegions[0].id
      logger.info(`  Region already exists: ${ctx.regionId}`)
    }
  } catch (error: any) {
    logger.error(`  Regions step failed: ${error.message}`)
  }

  // ============================================================
  // STEP 5: Shipping Profile
  // ============================================================
  logger.info("\nStep 5: Creating shipping profile...")
  try {
    const shippingProfiles = await fulfillmentModuleService.listShippingProfiles({ type: "default" })
    let shippingProfile = shippingProfiles.length ? shippingProfiles[0] : null

    if (!shippingProfile) {
      const { result } = await createShippingProfilesWorkflow(container).run({
        input: { data: [{ name: "Default Shipping Profile", type: "default" }] },
      })
      shippingProfile = result[0]
      logger.info("  Created: Default Shipping Profile")
    } else {
      logger.info("  Shipping profile already exists")
    }

    ctx.shippingProfileId = shippingProfile.id
  } catch (error: any) {
    logger.error(`  Shipping profile step failed: ${error.message}`)
  }

  // ============================================================
  // STEP 6: Stock Location
  // ============================================================
  logger.info("\nStep 6: Creating stock location...")
  try {
    const stockLocationModule = container.resolve(Modules.STOCK_LOCATION)
    const existingLocations = await stockLocationModule.listStockLocations({ name: "Dakkah Central Warehouse" })
    let stockLocation: any

    if (existingLocations.length === 0) {
      const { result: stockLocationResult } = await createStockLocationsWorkflow(container).run({
        input: {
          locations: [
            {
              name: "Dakkah Central Warehouse",
              address: {
                city: "Riyadh",
                country_code: "sa",
                address_1: "King Fahd Road",
                postal_code: "12211",
              },
            },
          ],
        },
      })
      stockLocation = stockLocationResult[0]
      logger.info("  Created: Dakkah Central Warehouse")

      try {
        await link.create({
          [Modules.STOCK_LOCATION]: { stock_location_id: stockLocation.id },
          [Modules.FULFILLMENT]: { fulfillment_provider_id: "manual_manual" },
        })
      } catch (linkError: any) {
        logger.error(`  Fulfillment provider link skipped: ${linkError.message}`)
      }
    } else {
      stockLocation = existingLocations[0]
      logger.info("  Dakkah Central Warehouse already exists")
    }

    ctx.stockLocationId = stockLocation.id

    try {
      await linkSalesChannelsToStockLocationWorkflow(container).run({
        input: { id: stockLocation.id, add: ctx.salesChannelIds },
      })
      logger.info("  Sales channels linked to stock location")
    } catch (linkError: any) {
      logger.error(`  Sales channel linking skipped: ${linkError.message}`)
    }
  } catch (error: any) {
    logger.error(`  Stock location step failed: ${error.message}`)
  }

  // ============================================================
  // STEP 7: Fulfillment Provider & Shipping Options
  // ============================================================
  logger.info("\nStep 7: Setting up fulfillment & shipping options...")
  try {
    const existingFulfillmentSets = await fulfillmentModuleService.listFulfillmentSets({ name: "Dakkah Warehouse Delivery" })
    let fulfillmentSet: any

    if (existingFulfillmentSets.length === 0) {
      fulfillmentSet = await fulfillmentModuleService.createFulfillmentSets({
        name: "Dakkah Warehouse Delivery",
        type: "shipping",
        service_zones: [
          {
            name: "Saudi Arabia",
            geo_zones: [{ country_code: "sa", type: "country" as const }],
          },
        ],
      })

      try {
        await link.create({
          [Modules.STOCK_LOCATION]: { stock_location_id: ctx.stockLocationId },
          [Modules.FULFILLMENT]: { fulfillment_set_id: fulfillmentSet.id },
        })
      } catch (linkError: any) {
        logger.error(`  Fulfillment set link skipped: ${linkError.message}`)
      }

      await createShippingOptionsWorkflow(container).run({
        input: [
          {
            name: "Standard Delivery",
            price_type: "flat",
            provider_id: "manual_manual",
            service_zone_id: fulfillmentSet.service_zones[0].id,
            shipping_profile_id: ctx.shippingProfileId,
            type: { label: "Standard", description: "Standard delivery (3-5 days)", code: "standard" },
            prices: [
              { currency_code: "sar", amount: 1500 },
              { currency_code: "usd", amount: 4 },
            ],
            rules: [
              { attribute: "enabled_in_store", value: "true", operator: "eq" },
              { attribute: "is_return", value: "false", operator: "eq" },
            ],
          },
          {
            name: "Express Delivery",
            price_type: "flat",
            provider_id: "manual_manual",
            service_zone_id: fulfillmentSet.service_zones[0].id,
            shipping_profile_id: ctx.shippingProfileId,
            type: { label: "Express", description: "Express delivery (1-2 days)", code: "express" },
            prices: [
              { currency_code: "sar", amount: 3500 },
              { currency_code: "usd", amount: 10 },
            ],
            rules: [
              { attribute: "enabled_in_store", value: "true", operator: "eq" },
              { attribute: "is_return", value: "false", operator: "eq" },
            ],
          },
          {
            name: "Same Day Delivery",
            price_type: "flat",
            provider_id: "manual_manual",
            service_zone_id: fulfillmentSet.service_zones[0].id,
            shipping_profile_id: ctx.shippingProfileId,
            type: { label: "Same Day", description: "Same day delivery", code: "same-day" },
            prices: [
              { currency_code: "sar", amount: 5000 },
              { currency_code: "usd", amount: 14 },
            ],
            rules: [
              { attribute: "enabled_in_store", value: "true", operator: "eq" },
              { attribute: "is_return", value: "false", operator: "eq" },
            ],
          },
        ],
      })
      logger.info("  Fulfillment set and shipping options created")
    } else {
      fulfillmentSet = existingFulfillmentSets[0]
      logger.info("  Fulfillment set already exists")
    }
  } catch (error: any) {
    logger.error(`  Fulfillment step failed: ${error.message}`)
  }

  // ============================================================
  // STEP 8: Publishable API Key
  // ============================================================
  logger.info("\nStep 8: Creating publishable API key...")
  try {
    let publishableApiKey: any = null

    try {
      const { data: existingApiKeys } = await query.graph({
        entity: "api_key",
        fields: ["id", "token", "title", "type"],
        filters: { title: "Dakkah Storefront API Key", type: "publishable" },
      })
      if (existingApiKeys && existingApiKeys.length > 0) {
        publishableApiKey = existingApiKeys[0]
        logger.info("  Publishable API key already exists")
      }
    } catch (checkError: any) {
      logger.error(`  Could not check existing API keys: ${checkError.message}`)
    }

    if (!publishableApiKey) {
      const { result: apiKeyResult } = await createApiKeysWorkflow(container).run({
        input: {
          api_keys: [{ title: "Dakkah Storefront API Key", type: "publishable", created_by: "" }],
        },
      })
      publishableApiKey = apiKeyResult[0]
      logger.info("  API Key created successfully")
    }

    ctx.apiKeyId = publishableApiKey.id

    try {
      await linkSalesChannelsToApiKeyWorkflow(container).run({
        input: { id: publishableApiKey.id, add: ctx.salesChannelIds },
      })
      logger.info("  Sales channels linked to API key")
    } catch (linkError: any) {
      logger.error(`  Sales channel to API key linking skipped: ${linkError.message}`)
    }
  } catch (error: any) {
    logger.error(`  API key step failed: ${error.message}`)
  }

  // ============================================================
  // STEP 9: Product Categories
  // ============================================================
  logger.info("\nStep 9: Creating product categories...")
  const categoryTree: Record<string, string[]> = {
    "Electronics": ["Smartphones", "Laptops", "Audio", "Wearables"],
    "Fashion": ["Men's Clothing", "Women's Clothing", "Shoes", "Accessories"],
    "Food & Beverages": ["Saudi Cuisine", "Coffee & Tea", "Dates & Sweets", "Spices"],
    "Home & Living": ["Furniture", "Kitchen", "Decor", "Lighting"],
    "Beauty & Personal Care": ["Skincare", "Fragrances", "Hair Care", "Makeup"],
    "Health & Wellness": ["Supplements", "Medical Devices", "Personal Care"],
    "Automotive": ["Car Parts", "Accessories", "Care Products"],
    "Sports & Fitness": ["Equipment", "Activewear", "Supplements"],
    "Books & Education": ["Arabic Books", "English Books", "Courses"],
    "Baby & Kids": ["Clothing", "Toys", "Baby Care"],
    "Grocery": ["Fresh Produce", "Dairy", "Pantry", "Beverages"],
    "Digital Products": ["Software", "E-books", "Online Courses"],
  }

  const toHandle = (name: string) =>
    name.toLowerCase().replace(/[&']/g, "").replace(/\s+/g, "-").replace(/-+/g, "-")

  try {
    const { data: existingCategories } = await query.graph({
      entity: "product_category",
      fields: ["id", "handle"],
    })
    const existingHandles = new Set((existingCategories || []).map((c: any) => c.handle))

    for (const c of existingCategories || []) {
      ctx.categoryIds[c.handle] = c.id
    }

    for (const [parentName, subcats] of Object.entries(categoryTree)) {
      const parentHandle = toHandle(parentName)

      if (!existingHandles.has(parentHandle)) {
        const { result: parentResult } = await createProductCategoriesWorkflow(container).run({
          input: {
            product_categories: [
              { name: parentName, handle: parentHandle, is_active: true, is_internal: false },
            ],
          },
        })
        const parentCat = parentResult[0]
        ctx.categoryIds[parentHandle] = parentCat.id
        existingHandles.add(parentHandle)
        logger.info(`  Created parent: ${parentName}`)

        const childData = subcats.map((sub) => ({
          name: sub,
          handle: toHandle(sub),
          is_active: true,
          is_internal: false,
          parent_category_id: parentCat.id,
        }))

        const { result: childResult } = await createProductCategoriesWorkflow(container).run({
          input: { product_categories: childData },
        })

        for (const child of childResult) {
          ctx.categoryIds[child.handle] = child.id
          existingHandles.add(child.handle)
        }
        logger.info(`    Created ${childResult.length} subcategories`)
      } else {
        logger.info(`  Exists: ${parentName}`)

        const parentId = ctx.categoryIds[parentHandle]
        for (const sub of subcats) {
          const subHandle = toHandle(sub)
          if (!existingHandles.has(subHandle) && parentId) {
            const { result: childResult } = await createProductCategoriesWorkflow(container).run({
              input: {
                product_categories: [
                  {
                    name: sub,
                    handle: subHandle,
                    is_active: true,
                    is_internal: false,
                    parent_category_id: parentId,
                  },
                ],
              },
            })
            ctx.categoryIds[subHandle] = childResult[0].id
            existingHandles.add(subHandle)
            logger.info(`    Created missing subcategory: ${sub}`)
          }
        }
      }
    }
  } catch (error: any) {
    logger.error(`  Categories step failed: ${error.message}`)
  }

  // ============================================================
  // STEP 10: Return SeedContext
  // ============================================================
  logger.info("\n========================================")
  logger.info("Core Infrastructure Seed Complete!")
  logger.info("========================================")
  logger.info(`Store ID: ${ctx.storeId}`)
  logger.info(`Region ID: ${ctx.regionId}`)
  logger.info(`Sales Channels: ${ctx.salesChannelIds.length}`)
  logger.info(`Stock Location: ${ctx.stockLocationId}`)
  logger.info(`Shipping Profile: ${ctx.shippingProfileId}`)
  logger.info(`API Key: ${ctx.apiKeyId}`)
  logger.info(`Categories: ${Object.keys(ctx.categoryIds).length}`)
  logger.info("========================================")

  return ctx
}
