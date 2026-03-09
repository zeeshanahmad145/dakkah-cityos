import { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { createRegionsWorkflow } from "@medusajs/medusa/core-flows"
import { createLogger } from "../lib/logger"
const logger = createLogger("scripts:seed-default-tenant")

export default async function seedDefaultTenant({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const tenantModuleService = container.resolve("tenant") as any
  const governanceModuleService = container.resolve("governance") as any
  const nodeModuleService = container.resolve("node") as any

  logger.info("========================================")
  logger.info("  Seed Default Tenant (Dakkah)")
  logger.info("========================================\n")

  // ============================================================
  // STEP 1: Update Tenant Record
  // ============================================================
  logger.info("Step 1: Updating tenant record...")
  try {
    const tenant = await tenantModuleService.retrieveTenantByHandle("dakkah")
    if (!tenant) {
      logger.info("  ✗ Tenant with handle 'dakkah' not found. Aborting.")
      return
    }

    logger.info(`  Found tenant: ${tenant.name} (${tenant.id})`)

    const existingSettings = tenant.settings || {}
    const updatedSettings = {
      ...existingSettings,
      features: {
        ...(existingSettings.features || {}),
        b2b: true,
        bookings: true,
        multi_vendor: true,
        subscriptions: true,
        digital_products: true,
        classifieds: true,
        auctions: true,
        rentals: true,
      },
    }

    await tenantModuleService.updateTenants({
      id: tenant.id,
      supported_locales: ["en", "ar", "fr"],
      residency_zone: "MENA",
      country_id: "sa",
      logo_url: null,
      settings: updatedSettings,
    })

    logger.info("  ✓ Tenant updated: supported_locales, residency_zone, country_id, settings")
  } catch (error: any) {
    logger.error(`  ✗ Tenant update failed: ${error.message}`)
  }

  // ============================================================
  // STEP 2: Update Governance Authority Policies
  // ============================================================
  logger.info("\nStep 2: Updating governance authority policies...")
  try {
    const tenant = await tenantModuleService.retrieveTenantByHandle("dakkah")
    const authorities = await governanceModuleService.listGovernanceAuthorities({
      tenant_id: tenant.id,
    })
    const authorityList = Array.isArray(authorities) ? authorities : [authorities].filter(Boolean)

    if (authorityList.length === 0) {
      logger.info("  ✗ No governance authority found for tenant. Skipping.")
    } else {
      const authority = authorityList[0]
      logger.info(`  Found authority: ${authority.name} (${authority.id})`)

      const comprehensivePolicies = {
        data: {
          classification: "confidential",
          residency_required: true,
        },
        commerce: {
          vat_rate: 15,
          require_vat: true,
          allow_cross_border: true,
          allowed_currencies: ["sar", "usd", "eur"],
          marketplace: true,
          subscriptions: true,
          bookings: true,
          b2b: true,
          digital_products: true,
          auctions: true,
          rentals: true,
          classifieds: true,
          crowdfunding: true,
          social_commerce: true,
        },
        content_moderation: {
          prohibited_categories: [],
          require_approval: false,
          auto_moderate: true,
        },
        verticals: {
          enabled: [
            "store", "vendors", "auctions", "rentals", "classifieds", "digital-products",
            "restaurants", "grocery",
            "healthcare", "fitness", "pet-services",
            "real-estate", "parking", "automotive", "travel",
            "education", "legal", "freelance",
            "financial-products", "memberships", "crowdfunding", "charity",
            "events", "social-commerce", "advertising",
            "bookings", "government", "utilities", "warranties",
          ],
        },
      }

      await governanceModuleService.updateGovernanceAuthorities({
        id: authority.id,
        policies: comprehensivePolicies,
      })

      logger.info("  ✓ Governance authority policies updated with all verticals")
    }
  } catch (error: any) {
    logger.error(`  ✗ Governance update failed: ${error.message}`)
  }

  // ============================================================
  // STEP 3: Create SAR Region (if not exists)
  // ============================================================
  logger.info("\nStep 3: Ensuring SAR region exists...")
  try {
    const { data: existingRegions } = await query.graph({
      entity: "region",
      fields: ["id", "name", "currency_code"],
      filters: { currency_code: "sar" },
    })

    if (existingRegions.length > 0) {
      logger.info(`  ✓ SAR region already exists: ${existingRegions[0].name} (${existingRegions[0].id})`)
    } else {
      const { result: regions } = await createRegionsWorkflow(container).run({
        input: {
          regions: [
            {
              name: "Saudi Arabia",
              currency_code: "sar",
              countries: ["sa"],
              is_tax_inclusive: true,
              automatic_taxes: true,
            },
          ],
        },
      })
      logger.info(`  ✓ Created SAR region: ${regions[0].name} (${regions[0].id})`)
    }
  } catch (error: any) {
    logger.error(`  ✗ SAR region creation failed: ${error.message}`)
  }

  // ============================================================
  // STEP 4: Ensure Node Hierarchy
  // ============================================================
  logger.info("\nStep 4: Ensuring node hierarchy...")
  try {
    const tenant = await tenantModuleService.retrieveTenantByHandle("dakkah")
    const existingNodes = await nodeModuleService.listNodesByTenant(tenant.id)

    if (existingNodes.length >= 5) {
      const types = existingNodes.map((n: any) => n.type)
      const hasAll = ["CITY", "DISTRICT", "ZONE", "FACILITY", "ASSET"].every((t) => types.includes(t))
      if (hasAll) {
        logger.info(`  ✓ Node hierarchy already exists (${existingNodes.length} nodes)`)
        logger.info("    Hierarchy:")
        const sorted = existingNodes.sort((a: any, b: any) => a.depth - b.depth)
        for (const node of sorted) {
          const indent = "  ".repeat(node.depth + 2)
          logger.info(`${indent}${node.type}: ${node.name} (${node.id})`)
        }
      } else {
        logger.info(`  ⚠ Found ${existingNodes.length} nodes but missing some types. Skipping to avoid duplicates.`)
      }
    } else if (existingNodes.length > 0) {
      logger.info(`  ⚠ Found ${existingNodes.length} nodes (incomplete hierarchy). Skipping to avoid duplicates.`)
    } else {
      logger.info("  Creating 5-level node hierarchy...")

      const city = await nodeModuleService.createNodeWithValidation({
        tenant_id: tenant.id,
        name: "Riyadh",
        slug: "riyadh",
        code: "RUH",
        type: "CITY",
        parent_id: null,
        location: { lat: 24.7136, lng: 46.6753 },
      })
      logger.info(`    ✓ CITY: Riyadh (${city.id})`)

      const district = await nodeModuleService.createNodeWithValidation({
        tenant_id: tenant.id,
        name: "Al Olaya",
        slug: "al-olaya",
        code: "OLY",
        type: "DISTRICT",
        parent_id: city.id,
      })
      logger.info(`    ✓ DISTRICT: Al Olaya (${district.id})`)

      const zone = await nodeModuleService.createNodeWithValidation({
        tenant_id: tenant.id,
        name: "King Fahad Zone",
        slug: "king-fahad-zone",
        code: "KFZ",
        type: "ZONE",
        parent_id: district.id,
      })
      logger.info(`    ✓ ZONE: King Fahad Zone (${zone.id})`)

      const facility = await nodeModuleService.createNodeWithValidation({
        tenant_id: tenant.id,
        name: "Main Mall",
        slug: "main-mall",
        code: "MM1",
        type: "FACILITY",
        parent_id: zone.id,
      })
      logger.info(`    ✓ FACILITY: Main Mall (${facility.id})`)

      const asset = await nodeModuleService.createNodeWithValidation({
        tenant_id: tenant.id,
        name: "Shop 101",
        slug: "shop-101",
        code: "S101",
        type: "ASSET",
        parent_id: facility.id,
      })
      logger.info(`    ✓ ASSET: Shop 101 (${asset.id})`)

      logger.info("  ✓ Node hierarchy created successfully")
    }
  } catch (error: any) {
    logger.error(`  ✗ Node hierarchy creation failed: ${error.message}`)
  }

  logger.info("\n========================================")
  logger.info("  Default Tenant Seed Complete")
  logger.info("========================================\n")
}
