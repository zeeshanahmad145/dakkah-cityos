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
  linkSalesChannelsToApiKeyWorkflow,
  linkSalesChannelsToStockLocationWorkflow,
  updateStoresWorkflow,
} from "@medusajs/medusa/core-flows"

export default async function seedCoreData({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const link = container.resolve(ContainerRegistrationKeys.LINK)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const fulfillmentModuleService = container.resolve(Modules.FULFILLMENT)
  const salesChannelModuleService = container.resolve(Modules.SALES_CHANNEL)
  const storeModuleService = container.resolve(Modules.STORE)

  logger.info("========================================")
  logger.info("Starting Core Seed")
  logger.info("========================================")

  // 1. Create Admin User
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
    logger.warn(`  Admin user creation skipped: ${error.message}`)
  }

  // 1b. Create Customer Accounts
  logger.info("Step 1b: Creating customer accounts...")
  const SEED_CUSTOMERS = [
    { email: "mohammed@dakkah.com", first_name: "Mohammed", last_name: "Al-Rashid", phone: "+966501234567", address: { address_1: "King Fahd Road, Al Olaya District", city: "Riyadh", postal_code: "12241" } },
    { email: "fatima@dakkah.com", first_name: "Fatima", last_name: "Al-Saud", phone: "+966502345678", address: { address_1: "Prince Sultan Road, Al Zahra District", city: "Jeddah", postal_code: "23425" } },
    { email: "ahmed@dakkah.com", first_name: "Ahmed", last_name: "Hassan", phone: "+966503456789", address: { address_1: "King Abdulaziz Road, Al Khobar", city: "Dammam", postal_code: "31952" } },
    { email: "khalid@dakkah.com", first_name: "Khalid", last_name: "Al-Dakkah", phone: "+966504567890", address: { address_1: "Tahlia Street, Al Rawdah District", city: "Jeddah", postal_code: "23432" } },
    { email: "sara@dakkah.com", first_name: "Sara", last_name: "Al-Mansour", phone: "+966505678901", address: { address_1: "Northern Ring Road, Al Nakheel", city: "Riyadh", postal_code: "12382" } },
    { email: "omar@dakkah.com", first_name: "Omar", last_name: "Al-Otaibi", phone: "+966506789012", address: { address_1: "Corniche Road, Al Hamra", city: "Jeddah", postal_code: "23511" } },
    { email: "noura@dakkah.com", first_name: "Noura", last_name: "Al-Shamrani", phone: "+966507890123", address: { address_1: "King Abdullah Road, Al Malaz", city: "Riyadh", postal_code: "12631" } },
    { email: "abdullah@dakkah.com", first_name: "Abdullah", last_name: "Al-Qahtani", phone: "+966508901234", address: { address_1: "Prince Faisal Road, Al Murjan", city: "Dammam", postal_code: "32411" } },
    { email: "test_customer@dakkah.com", first_name: "Test", last_name: "Customer", phone: "+966509012345", address: { address_1: "King Saud Road, Al Wizarat", city: "Riyadh", postal_code: "12611" } },
  ]

  try {
    const authModuleService = container.resolve(Modules.AUTH)
    const customerModuleService = container.resolve(Modules.CUSTOMER)

    for (const cust of SEED_CUSTOMERS) {
      try {
        const existing = await customerModuleService.listCustomers({ email: cust.email })
        if (existing.length > 0) {
          logger.info(`  Customer ${cust.email} already exists`)
          continue
        }

        const authIdentity = await authModuleService.createAuthIdentities({
          provider_identities: [{
            provider: "emailpass",
            entity_id: cust.email,
            provider_metadata: { password: "Dakkah2024!" },
          }],
        })

        const customer = await customerModuleService.createCustomers({
          email: cust.email,
          first_name: cust.first_name,
          last_name: cust.last_name,
          phone: cust.phone,
          has_account: true,
        })

        await authModuleService.updateAuthIdentities({
          id: authIdentity.id,
          app_metadata: { customer_id: customer.id },
        })

        await customerModuleService.addCustomerAddresses({
          customer_id: customer.id,
          first_name: cust.first_name,
          last_name: cust.last_name,
          address_1: cust.address.address_1,
          city: cust.address.city,
          country_code: "sa",
          postal_code: cust.address.postal_code,
          phone: cust.phone,
          is_default_shipping: true,
        })

        logger.info(`  Created customer: ${cust.email} (${customer.id})`)
      } catch (err: any) {
        logger.warn(`  Customer ${cust.email} skipped: ${err.message}`)
      }
    }
  } catch (error: any) {
    logger.warn(`  Customer seeding skipped: ${error.message}`)
  }

  // 2. Setup Store
  logger.info("Step 2: Setting up store...")
  const [store] = await storeModuleService.listStores()

  // 3. Create Sales Channels
  logger.info("Step 3: Creating sales channels...")
  let defaultSalesChannel = await salesChannelModuleService.listSalesChannels({
    name: "Default Sales Channel",
  })

  if (!defaultSalesChannel.length) {
    const { result: salesChannelResult } = await createSalesChannelsWorkflow(container).run({
      input: {
        salesChannelsData: [
          { name: "Default Sales Channel" },
        ],
      },
    })
    defaultSalesChannel = salesChannelResult
    logger.info("  Created Default Sales Channel")
  } else {
    logger.info("  Default Sales Channel already exists")
  }

  let webChannels = await salesChannelModuleService.listSalesChannels({
    name: "Web Store",
  })
  if (!webChannels.length) {
    const { result } = await createSalesChannelsWorkflow(container).run({
      input: {
        salesChannelsData: [
          { name: "Web Store", description: "Online web storefront" },
        ],
      },
    })
    webChannels = result
    logger.info("  Created Web Store channel")
  }

  let mobileChannels = await salesChannelModuleService.listSalesChannels({
    name: "Mobile App",
  })
  if (!mobileChannels.length) {
    const { result } = await createSalesChannelsWorkflow(container).run({
      input: {
        salesChannelsData: [
          { name: "Mobile App", description: "Mobile application storefront" },
        ],
      },
    })
    mobileChannels = result
    logger.info("  Created Mobile App channel")
  }

  const allChannelIds = [
    defaultSalesChannel[0].id,
    webChannels[0].id,
    mobileChannels[0].id,
  ]

  // 4. Clean up price preferences and update store
  logger.info("Step 4: Updating store settings...")
  const { data: pricePreferences } = await query.graph({
    entity: "price_preference",
    fields: ["id"],
  })

  if (pricePreferences.length > 0) {
    const ids = pricePreferences.map((pp) => pp.id)
    await container.resolve(Modules.PRICING).deletePricePreferences(ids)
  }

  await updateStoresWorkflow(container).run({
    input: {
      selector: { id: store.id },
      update: {
        supported_currencies: [
          { currency_code: "sar", is_default: true },
          { currency_code: "usd" },
          { currency_code: "eur" },
        ],
        default_sales_channel_id: defaultSalesChannel[0].id,
      },
    },
  })
  logger.info("  Store updated with SAR as default currency")

  // 5. Create Regions
  logger.info("Step 5: Creating regions...")
  const { data: existingRegions } = await query.graph({
    entity: "region",
    fields: ["id", "name"],
  })

  if (!existingRegions || existingRegions.length === 0) {
    const { result: regionResult } = await createRegionsWorkflow(container).run({
      input: {
        regions: [
          {
            name: "MENA",
            currency_code: "sar",
            countries: ["sa", "ae", "kw", "qa", "bh", "om"],
            payment_providers: ["pp_system_default"],
            automatic_taxes: false,
            is_tax_inclusive: true,
          },
          {
            name: "International",
            currency_code: "usd",
            countries: ["us", "gb"],
            payment_providers: ["pp_system_default"],
            automatic_taxes: false,
            is_tax_inclusive: false,
          },
        ],
      },
    })
    logger.info(`  Created ${regionResult.length} regions`)
  } else {
    const menaRegion = existingRegions.find((r: any) => r.name === "MENA")
    if (menaRegion) {
      logger.info(`  MENA region found (${menaRegion.id})`)
    } else {
      logger.info(`  MENA region not found, using fallback: ${existingRegions[0].name} (${existingRegions[0].id})`)
    }
    logger.info(`  Regions already exist (${existingRegions.length})`)
  }

  // 6. Create Stock Location
  logger.info("Step 6: Creating stock location...")
  const stockLocationModule = container.resolve(Modules.STOCK_LOCATION)
  const existingLocations = await stockLocationModule.listStockLocations({ name: "Riyadh Warehouse" })
  let stockLocation: any

  if (existingLocations.length === 0) {
    const { result: stockLocationResult } = await createStockLocationsWorkflow(container).run({
      input: {
        locations: [
          {
            name: "Riyadh Warehouse",
            address: {
              city: "Riyadh",
              country_code: "SA",
              address_1: "King Fahad Road",
            },
          },
        ],
      },
    })
    stockLocation = stockLocationResult[0]
    logger.info("  Created Riyadh Warehouse")

    try {
      await link.create({
        [Modules.STOCK_LOCATION]: { stock_location_id: stockLocation.id },
        [Modules.FULFILLMENT]: { fulfillment_provider_id: "manual_manual" },
      })
    } catch (linkError: any) {
      logger.warn(`  Fulfillment provider link already exists or failed: ${linkError.message}`)
    }
  } else {
    stockLocation = existingLocations[0]
    logger.info("  Riyadh Warehouse already exists")
  }

  // 7. Setup Fulfillment
  logger.info("Step 7: Setting up fulfillment...")
  const shippingProfiles = await fulfillmentModuleService.listShippingProfiles({ type: "default" })
  let shippingProfile = shippingProfiles.length ? shippingProfiles[0] : null

  if (!shippingProfile) {
    const { result: shippingProfileResult } = await createShippingProfilesWorkflow(container).run({
      input: {
        data: [{ name: "Default Shipping Profile", type: "default" }],
      },
    })
    shippingProfile = shippingProfileResult[0]
  }

  const existingFulfillmentSets = await fulfillmentModuleService.listFulfillmentSets({ name: "Riyadh Warehouse Delivery" })

  if (existingFulfillmentSets.length === 0) {
    const fulfillmentSet = await fulfillmentModuleService.createFulfillmentSets({
      name: "Riyadh Warehouse Delivery",
      type: "shipping",
      service_zones: [
        {
          name: "MENA Zone",
          geo_zones: ["sa", "ae", "kw", "qa", "bh", "om"].map((country_code) => ({
            country_code,
            type: "country" as const,
          })),
        },
      ],
    })

    try {
      await link.create({
        [Modules.STOCK_LOCATION]: { stock_location_id: stockLocation.id },
        [Modules.FULFILLMENT]: { fulfillment_set_id: fulfillmentSet.id },
      })
    } catch (linkError: any) {
      logger.warn(`  Fulfillment set link already exists or failed: ${linkError.message}`)
    }

    await createShippingOptionsWorkflow(container).run({
      input: [
        {
          name: "Standard Shipping",
          price_type: "flat",
          provider_id: "manual_manual",
          service_zone_id: fulfillmentSet.service_zones[0].id,
          shipping_profile_id: shippingProfile.id,
          type: {
            label: "Standard",
            description: "Standard shipping (3-5 days)",
            code: "standard",
          },
          prices: [
            { currency_code: "sar", amount: 15 },
            { currency_code: "usd", amount: 10 },
          ],
          rules: [
            { attribute: "enabled_in_store", value: "true", operator: "eq" },
            { attribute: "is_return", value: "false", operator: "eq" },
          ],
        },
        {
          name: "Express Shipping",
          price_type: "flat",
          provider_id: "manual_manual",
          service_zone_id: fulfillmentSet.service_zones[0].id,
          shipping_profile_id: shippingProfile.id,
          type: {
            label: "Express",
            description: "Express shipping (1-2 days)",
            code: "express",
          },
          prices: [
            { currency_code: "sar", amount: 35 },
            { currency_code: "usd", amount: 25 },
          ],
          rules: [
            { attribute: "enabled_in_store", value: "true", operator: "eq" },
            { attribute: "is_return", value: "false", operator: "eq" },
          ],
        },
      ],
    })
    logger.info("  Fulfillment and shipping options created")
  } else {
    logger.info("  Fulfillment set already exists")
  }

  // 8. Link Sales Channels to Stock Location
  logger.info("Step 8: Linking sales channels...")
  try {
    await linkSalesChannelsToStockLocationWorkflow(container).run({
      input: {
        id: stockLocation.id,
        add: allChannelIds,
      },
    })
    logger.info("  Sales channels linked")
  } catch (linkError: any) {
    logger.warn(`  Sales channel linking skipped (may already be linked): ${linkError.message}`)
  }

  // 9. Create Publishable API Key
  logger.info("Step 9: Creating publishable API key...")
  let publishableApiKey: any = null

  try {
    const { data: existingApiKeys } = await query.graph({
      entity: "api_key",
      fields: ["id", "token", "title", "type"],
      filters: { title: "Storefront API Key", type: "publishable" },
    })

    if (existingApiKeys && existingApiKeys.length > 0) {
      publishableApiKey = existingApiKeys[0]
      logger.info(`  Publishable API key already exists`)
    }
  } catch (checkError: any) {
    logger.warn(`  Could not check existing API keys: ${checkError.message}`)
  }

  if (!publishableApiKey) {
    const { result: publishableApiKeyResult } = await createApiKeysWorkflow(container).run({
      input: {
        api_keys: [
          { title: "Storefront API Key", type: "publishable", created_by: "" },
        ],
      },
    })
    publishableApiKey = publishableApiKeyResult[0]
    logger.info(`  API Key created successfully`)
  }

  try {
    await linkSalesChannelsToApiKeyWorkflow(container).run({
      input: {
        id: publishableApiKey.id,
        add: allChannelIds,
      },
    })
  } catch (linkError: any) {
    logger.warn(`  Sales channel to API key linking skipped: ${linkError.message}`)
  }

  logger.info("")
  logger.info("========================================")
  logger.info("Core Seed Complete!")
  logger.info("========================================")
  logger.info(`Publishable API Key: [REDACTED - retrieve from admin panel]`)
  logger.info("Admin Email: admin@dakkah.sa")
  logger.info("========================================")
}
