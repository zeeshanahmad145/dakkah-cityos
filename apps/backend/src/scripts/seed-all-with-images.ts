// @ts-nocheck
import { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
const { preUploadCategoryImages, getImage, getThumb, sarPrice, randomSaudiCity, saudiPhone } = require("./seed-utils")

export default async function seedAllWithImages({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const T = "dakkah"

  const log = (msg: string) => logger.info(msg)
  const logError = (section: string, err: any) => logger.warn(`  ❌ ${section} failed: ${err.message}`)

  const resolveService = (key: string) => {
    try { return container.resolve(key) as any }
    catch { return null }
  }

  const resolveAny = (...keys: string[]) => {
    for (const k of keys) {
      const s = resolveService(k)
      if (s) return s
    }
    return null
  }

  const tryCreate = async (svc: any, data: any[], methods: string[]) => {
    for (const method of methods) {
      if (typeof svc[method] === "function") {
        return await svc[method](data)
      }
    }
    const results = []
    for (const item of data) {
      for (const method of methods) {
        const singular = method.replace(/s$/, "")
        if (typeof svc[singular] === "function") {
          results.push(await svc[singular](item))
          break
        }
      }
    }
    return results
  }

  const startTime = Date.now()

  log("╔══════════════════════════════════════════════════════════════╗")
  log("║     DAKKAH CITYOS — SEED ALL WITH IMAGES                   ║")
  log("╚══════════════════════════════════════════════════════════════╝")

  // ━━━ PHASE 1: IMAGE URLS ━━━
  log("\n━━━ PHASE 1: IMAGE URLS (using bucket path references) ━━━")
  log("  ✓ Image URLs configured via getImage()/getThumb() — no download needed")

  // ━━━ PHASE 2: SEED VERTICALS (27 modules) ━━━
  log("\n━━━ PHASE 2: SEED VERTICALS (27 modules) ━━━")
  try {
    const seedVerticals = require("./seed-verticals").default
    const ctx = {
      tenantId: T,
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
    await seedVerticals({ container }, ctx)
    log("  ✓ Vertical modules seed complete")
  } catch (err: any) {
    logError("Seed Verticals", err)
  }

  // ━━━ PHASE 3: INFRASTRUCTURE / CONFIG MODULES ━━━
  log("\n━━━ PHASE 3: INFRASTRUCTURE / CONFIG MODULES ━━━")

  // ── TENANT ──
  try {
    const svc = resolveAny("tenant", "tenantModuleService")
    if (!svc) { log("  ⚠ Tenant service not found, skipping") } else {
      const data = [{
        id: T,
        name: "Dakkah CityOS",
        handle: "dakkah",
        slug: "dakkah",
        residency_zone: "sa-central",
        default_locale: "en",
        supported_locales: ["en", "ar", "fr"],
        timezone: "Asia/Riyadh",
        default_currency: "sar",
        date_format: "DD/MM/YYYY",
        is_active: true,
        domain: "dakkah.sa",
        logo_url: getThumb("vendor", 0),
        metadata: { seeded: true },
      }]
      await tryCreate(svc, data, ["createTenants", "create"])
      log("  ✓ Tenant: dakkah record created")
    }
  } catch (err: any) { logError("Tenant", err) }

  // ── PERSONA ──
  try {
    const svc = resolveAny("persona", "personaModuleService")
    if (!svc) { log("  ⚠ Persona service not found, skipping") } else {
      const data = [
        { tenant_id: T, name: "Consumer", handle: "consumer", slug: "consumer", category: "consumer", description: "End-user shopping persona", is_default: true, is_active: true, metadata: { seeded: true } },
        { tenant_id: T, name: "Vendor", handle: "vendor", slug: "vendor", category: "business", description: "Marketplace seller persona", is_default: false, is_active: true, metadata: { seeded: true } },
        { tenant_id: T, name: "Admin", handle: "admin", slug: "admin", category: "platform", description: "Platform administrator persona", is_default: false, is_active: true, metadata: { seeded: true } },
      ]
      await tryCreate(svc, data, ["createPersonas", "create"])
      log("  ✓ Persona: 3 personas created (consumer, vendor, admin)")
    }
  } catch (err: any) { logError("Persona", err) }

  // ── GOVERNANCE ──
  try {
    const svc = resolveAny("governance", "governanceModuleService")
    if (!svc) { log("  ⚠ Governance service not found, skipping") } else {
      const data = [{
        tenant_id: T,
        name: "Platform Governance Policy",
        handle: "platform-governance",
        type: "platform",
        description: "Core platform governance rules for Dakkah CityOS marketplace",
        rules: {
          vendor_approval_required: true,
          product_review_required: true,
          max_commission_rate: 25,
          min_payout_amount: 100,
          dispute_resolution_days: 14,
          content_moderation: true,
        },
        is_active: true,
        metadata: { seeded: true },
      }]
      await tryCreate(svc, data, ["createGovernancePolicies", "createGovernances", "create"])
      log("  ✓ Governance: platform policy created")
    }
  } catch (err: any) { logError("Governance", err) }

  // ── WALLET ──
  try {
    const svc = resolveAny("wallet", "walletModuleService")
    if (!svc) { log("  ⚠ Wallet service not found, skipping") } else {
      const data = [
        { tenant_id: T, customer_id: "cus_seed_01", currency_code: "sar", balance: sarPrice(500), name: "Customer Wallet 1", is_active: true, metadata: { seeded: true } },
        { tenant_id: T, customer_id: "cus_seed_02", currency_code: "sar", balance: sarPrice(1200), name: "Customer Wallet 2", is_active: true, metadata: { seeded: true } },
        { tenant_id: T, customer_id: "ven_seed_01", currency_code: "sar", balance: sarPrice(8500), name: "Vendor Wallet 1", is_active: true, metadata: { seeded: true } },
      ]
      await tryCreate(svc, data, ["createWallets", "create"])
      log("  ✓ Wallet: 3 wallets created")
    }
  } catch (err: any) { logError("Wallet", err) }

  // ── NOTIFICATION PREFERENCES ──
  try {
    const svc = resolveAny("notificationPreferences", "notification_preferences", "notification-preferences", "notificationPreferencesModuleService")
    if (!svc) { log("  ⚠ Notification Preferences service not found, skipping") } else {
      const data = [
        { tenant_id: T, customer_id: "cus_seed_01", channel: "email", event_type: "order_updates", is_enabled: true, metadata: { seeded: true } },
        { tenant_id: T, customer_id: "cus_seed_01", channel: "sms", event_type: "promotions", is_enabled: false, metadata: { seeded: true } },
        { tenant_id: T, customer_id: "cus_seed_01", channel: "push", event_type: "order_updates", is_enabled: true, metadata: { seeded: true } },
        { tenant_id: T, customer_id: "cus_seed_02", channel: "email", event_type: "order_updates", is_enabled: true, metadata: { seeded: true } },
        { tenant_id: T, customer_id: "cus_seed_02", channel: "email", event_type: "promotions", is_enabled: true, metadata: { seeded: true } },
      ]
      await tryCreate(svc, data, ["createNotificationPreferences", "createNotificationPreferencess", "create"])
      log("  ✓ Notification Preferences: 5 preferences created")
    }
  } catch (err: any) { logError("Notification Preferences", err) }

  // ── CMS CONTENT ──
  try {
    const svc = resolveAny("cmsContent", "cms_content", "cms-content", "cmsContentModuleService")
    if (!svc) { log("  ⚠ CMS Content service not found, skipping") } else {
      const data = [
        {
          tenant_id: T,
          title: "Welcome to Dakkah CityOS",
          slug: "homepage",
          type: "page",
          content: "<h1>Welcome to Dakkah</h1><p>Your all-in-one city operating system for commerce, services, and community.</p>",
          status: "published",
          is_active: true,
          thumbnail: getThumb("vendor", 0),
          metadata: { seeded: true, page_type: "homepage" },
        },
        {
          tenant_id: T,
          title: "About Dakkah CityOS",
          slug: "about",
          type: "page",
          content: "<h1>About Us</h1><p>Dakkah CityOS is Saudi Arabia's premier multi-vertical marketplace platform, powering everything from e-commerce to government services.</p>",
          status: "published",
          is_active: true,
          thumbnail: getThumb("vendor", 1),
          metadata: { seeded: true, page_type: "about" },
        },
        {
          tenant_id: T,
          title: "Contact Us",
          slug: "contact",
          type: "page",
          content: "<h1>Contact Us</h1><p>Email: support@dakkah.sa</p><p>Phone: +966 11 234 5678</p><p>Address: KAFD, Riyadh, Saudi Arabia</p>",
          status: "published",
          is_active: true,
          metadata: { seeded: true, page_type: "contact" },
        },
      ]
      await tryCreate(svc, data, ["createCmsContents", "createPages", "create"])
      log("  ✓ CMS Content: 3 pages created (homepage, about, contact)")
    }
  } catch (err: any) { logError("CMS Content", err) }

  // ── VOLUME PRICING ──
  try {
    const svc = resolveAny("volumePricing", "volume_pricing", "volume-pricing", "volumePricingModuleService")
    if (!svc) { log("  ⚠ Volume Pricing service not found, skipping") } else {
      const data = [
        { tenant_id: T, product_id: "prod_seed_01", volume_pricing_id: "vp_seed_01", min_quantity: 10, max_quantity: 49, price: sarPrice(90), currency_code: "sar", discount_percentage: 10, metadata: { seeded: true } },
        { tenant_id: T, product_id: "prod_seed_01", volume_pricing_id: "vp_seed_01", min_quantity: 50, max_quantity: 99, price: sarPrice(80), currency_code: "sar", discount_percentage: 20, metadata: { seeded: true } },
        { tenant_id: T, product_id: "prod_seed_01", volume_pricing_id: "vp_seed_01", min_quantity: 100, max_quantity: null, price: sarPrice(70), currency_code: "sar", discount_percentage: 30, metadata: { seeded: true } },
        { tenant_id: T, product_id: "prod_seed_02", volume_pricing_id: "vp_seed_02", min_quantity: 5, max_quantity: 24, price: sarPrice(180), currency_code: "sar", discount_percentage: 5, metadata: { seeded: true } },
        { tenant_id: T, product_id: "prod_seed_02", volume_pricing_id: "vp_seed_02", min_quantity: 25, max_quantity: null, price: sarPrice(160), currency_code: "sar", discount_percentage: 15, metadata: { seeded: true } },
        { tenant_id: T, product_id: "prod_seed_03", volume_pricing_id: "vp_seed_03", min_quantity: 20, max_quantity: null, price: sarPrice(45), currency_code: "sar", discount_percentage: 10, metadata: { seeded: true } },
      ]
      await tryCreate(svc, data, ["createVolumePricingTiers", "createVolumePricings", "create"])
      log("  ✓ Volume Pricing: 6 tiers created for 3 products")
    }
  } catch (err: any) { logError("Volume Pricing", err) }

  // ── TAX CONFIG ──
  try {
    const svc = resolveAny("taxConfig", "tax_config", "tax-config", "taxConfigModuleService")
    if (!svc) { log("  ⚠ Tax Config service not found, skipping") } else {
      const data = [{
        tenant_id: T,
        name: "Saudi Arabia VAT",
        country_code: "sa",
        tax_type: "vat",
        rate: 15.0,
        is_inclusive: false,
        is_active: true,
        description: "Standard Saudi Arabia Value Added Tax (VAT) at 15%",
        applies_to: ["products", "services", "digital"],
        exemptions: ["healthcare_essential", "education", "financial_services"],
        metadata: { seeded: true, authority: "ZATCA" },
      }]
      await tryCreate(svc, data, ["createTaxConfigs", "create"])
      log("  ✓ Tax Config: Saudi Arabia VAT (15%) created")
    }
  } catch (err: any) { logError("Tax Config", err) }

  // ── REGION ZONE ──
  try {
    const svc = resolveAny("regionZone", "region_zone", "region-zone", "regionZoneModuleService")
    if (!svc) { log("  ⚠ Region Zone service not found, skipping") } else {
      const data = [
        { tenant_id: T, name: "Central Region", code: "central", country_code: "sa", cities: ["Riyadh", "Buraidah", "Ha'il"], is_active: true, delivery_available: true, metadata: { seeded: true } },
        { tenant_id: T, name: "Western Region", code: "western", country_code: "sa", cities: ["Jeddah", "Mecca", "Medina", "Taif", "Yanbu"], is_active: true, delivery_available: true, metadata: { seeded: true } },
        { tenant_id: T, name: "Eastern Region", code: "eastern", country_code: "sa", cities: ["Dammam", "Khobar", "Dhahran", "Al Jubail", "Al Ahsa"], is_active: true, delivery_available: true, metadata: { seeded: true } },
        { tenant_id: T, name: "Southern Region", code: "southern", country_code: "sa", cities: ["Abha", "Khamis Mushait", "Najran", "Jizan"], is_active: true, delivery_available: true, metadata: { seeded: true } },
        { tenant_id: T, name: "Northern Region", code: "northern", country_code: "sa", cities: ["Tabuk", "Sakaka", "Arar"], is_active: true, delivery_available: true, metadata: { seeded: true } },
      ]
      await tryCreate(svc, data, ["createRegionZones", "create"])
      log("  ✓ Region Zone: 5 Saudi zones created")
    }
  } catch (err: any) { logError("Region Zone", err) }

  // ── SUBSCRIPTION ──
  try {
    const svc = resolveAny("subscription", "subscriptionModuleService")
    if (!svc) { log("  ⚠ Subscription service not found, skipping") } else {
      const data = [
        {
          tenant_id: T,
          name: "Basic Plan",
          handle: "basic",
          description: "Essential features for small businesses",
          price: sarPrice(99),
          currency_code: "sar",
          interval: "month",
          interval_count: 1,
          features: ["5 product listings", "Basic analytics", "Email support"],
          is_active: true,
          trial_days: 14,
          metadata: { seeded: true, tier: "basic" },
        },
        {
          tenant_id: T,
          name: "Premium Plan",
          handle: "premium",
          description: "Advanced tools for growing businesses",
          price: sarPrice(299),
          currency_code: "sar",
          interval: "month",
          interval_count: 1,
          features: ["Unlimited listings", "Advanced analytics", "Priority support", "Custom branding", "API access"],
          is_active: true,
          trial_days: 7,
          metadata: { seeded: true, tier: "premium" },
        },
        {
          tenant_id: T,
          name: "Enterprise Plan",
          handle: "enterprise",
          description: "Full platform capabilities for large organizations",
          price: sarPrice(999),
          currency_code: "sar",
          interval: "month",
          interval_count: 1,
          features: ["Everything in Premium", "Dedicated account manager", "SLA guarantee", "White-label options", "Custom integrations", "Bulk operations"],
          is_active: true,
          trial_days: 30,
          metadata: { seeded: true, tier: "enterprise" },
        },
      ]
      await tryCreate(svc, data, ["createSubscriptionPlans", "createSubscriptions", "create"])
      log("  ✓ Subscription: 3 plans created (Basic, Premium, Enterprise)")
    }
  } catch (err: any) { logError("Subscription", err) }

  // ── QUOTE ──
  try {
    const svc = resolveAny("quote", "quoteModuleService")
    if (!svc) { log("  ⚠ Quote service not found, skipping") } else {
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + 30)
      const data = [{
        tenant_id: T,
        quote_number: "Q-SEED-001",
        title: "B2B Office Supplies Bulk Order",
        customer_id: "cus_seed_01",
        company_id: "comp_seed_01",
        contact_email: "procurement@sauditech.sa",
        contact_phone: "+966112223344",
        status: "draft",
        currency_code: "sar",
        subtotal: sarPrice(25000),
        discount_total: 0,
        tax_total: sarPrice(3750),
        shipping_total: 0,
        total: sarPrice(28750),
        items: [
          { product_id: "prod_seed_01", title: "Laptop Dell XPS 15", quantity: 10, unit_price: sarPrice(1500), total: sarPrice(15000) },
          { product_id: "prod_seed_02", title: "Monitor 27inch 4K", quantity: 10, unit_price: sarPrice(800), total: sarPrice(8000) },
          { product_id: "prod_seed_03", title: "Wireless Keyboard & Mouse Set", quantity: 20, unit_price: sarPrice(100), total: sarPrice(2000) },
        ],
        notes: "Requesting bulk pricing for new office setup. Need delivery to KAFD, Riyadh.",
        expires_at: expiresAt.toISOString(),
        metadata: { seeded: true },
      }]
      await tryCreate(svc, data, ["createQuotes", "create"])
      log("  ✓ Quote: 1 B2B quote created")
    }
  } catch (err: any) { logError("Quote", err) }

  // ── INSURANCE ──
  try {
    const svc = resolveAny("insurance", "insuranceModuleService")
    if (!svc) { log("  ⚠ Insurance service not found, skipping") } else {
      const data = [
        {
          tenant_id: T,
          name: "Basic Protection Plan",
          handle: "basic-protection",
          type: "product",
          description: "Covers manufacturing defects and basic damage for 1 year",
          price: sarPrice(49),
          currency_code: "sar",
          coverage_amount: sarPrice(5000),
          duration_months: 12,
          coverage_details: ["Manufacturing defects", "Basic accidental damage"],
          is_active: true,
          thumbnail: getThumb("electronics", 0),
          metadata: { seeded: true, tier: "basic" },
        },
        {
          tenant_id: T,
          name: "Standard Protection Plan",
          handle: "standard-protection",
          type: "product",
          description: "Extended coverage including accidental damage and theft for 2 years",
          price: sarPrice(129),
          currency_code: "sar",
          coverage_amount: sarPrice(15000),
          duration_months: 24,
          coverage_details: ["Manufacturing defects", "Accidental damage", "Theft protection", "Free repairs"],
          is_active: true,
          thumbnail: getThumb("electronics", 1),
          metadata: { seeded: true, tier: "standard" },
        },
        {
          tenant_id: T,
          name: "Premium Protection Plan",
          handle: "premium-protection",
          type: "product",
          description: "Complete coverage with replacement guarantee and priority service",
          price: sarPrice(249),
          currency_code: "sar",
          coverage_amount: sarPrice(50000),
          duration_months: 36,
          coverage_details: ["All Standard features", "Full replacement guarantee", "Priority service", "International coverage", "No deductible"],
          is_active: true,
          thumbnail: getThumb("electronics", 2),
          metadata: { seeded: true, tier: "premium" },
        },
      ]
      await tryCreate(svc, data, ["createInsurancePlans", "createInsurances", "create"])
      log("  ✓ Insurance: 3 plans created (Basic, Standard, Premium)")
    }
  } catch (err: any) { logError("Insurance", err) }

  // ── MEMBERSHIP ──
  try {
    const svc = resolveAny("membership", "membershipModuleService")
    if (!svc) { log("  ⚠ Membership service not found, skipping") } else {
      const data = [
        {
          tenant_id: T,
          name: "Silver Membership",
          handle: "silver",
          description: "Entry-level membership with basic perks",
          price: sarPrice(50),
          currency_code: "sar",
          interval: "month",
          tier: "silver",
          tier_level: 1,
          benefits: ["5% discount on all purchases", "Free standard shipping", "Early access to sales"],
          is_active: true,
          thumbnail: getThumb("fashion", 0),
          metadata: { seeded: true },
        },
        {
          tenant_id: T,
          name: "Gold Membership",
          handle: "gold",
          description: "Premium membership with enhanced benefits",
          price: sarPrice(150),
          currency_code: "sar",
          interval: "month",
          tier: "gold",
          tier_level: 2,
          benefits: ["10% discount on all purchases", "Free express shipping", "Priority customer support", "Exclusive member events", "Birthday bonus"],
          is_active: true,
          thumbnail: getThumb("fashion", 1),
          metadata: { seeded: true },
        },
        {
          tenant_id: T,
          name: "Platinum Membership",
          handle: "platinum",
          description: "Elite membership with maximum perks and exclusive access",
          price: sarPrice(350),
          currency_code: "sar",
          interval: "month",
          tier: "platinum",
          tier_level: 3,
          benefits: ["15% discount on all purchases", "Free same-day delivery", "Dedicated concierge", "VIP events access", "Free returns", "Exclusive products", "Annual gift box"],
          is_active: true,
          thumbnail: getThumb("fashion", 2),
          metadata: { seeded: true },
        },
      ]
      await tryCreate(svc, data, ["createMembershipTiers", "createMemberships", "create"])
      log("  ✓ Membership: 3 tiers created (Silver, Gold, Platinum)")
    }
  } catch (err: any) { logError("Membership", err) }

  // ── LOYALTY ──
  try {
    const svc = resolveAny("loyalty", "loyaltyModuleService")
    if (!svc) { log("  ⚠ Loyalty service not found, skipping") } else {
      const data = [{
        tenant_id: T,
        name: "Dakkah Rewards",
        description: "Earn points on every purchase and redeem for discounts, free shipping, and exclusive rewards",
        currency_code: "sar",
        points_per_currency: 1,
        is_active: true,
        tier_config: [
          { name: "Bronze", min_points: 0, multiplier: 1.0, benefits: ["1x points earning"] },
          { name: "Silver", min_points: 1000, multiplier: 1.5, benefits: ["1.5x points earning", "Free shipping on orders over 100 SAR"] },
          { name: "Gold", min_points: 5000, multiplier: 2.0, benefits: ["2x points earning", "Free shipping", "Early sale access"] },
          { name: "Platinum", min_points: 15000, multiplier: 3.0, benefits: ["3x points earning", "Free express shipping", "VIP events", "Birthday bonus points"] },
        ],
        metadata: { seeded: true },
      }]
      await tryCreate(svc, data, ["createLoyaltyPrograms", "createLoyaltys", "create"])
      log("  ✓ Loyalty: Dakkah Rewards program created with 4 tiers")
    }
  } catch (err: any) { logError("Loyalty", err) }

  // ── DIGITAL PRODUCT ──
  try {
    const svc = resolveAny("digitalProduct", "digital_product", "digital-product", "digitalProductModuleService")
    if (!svc) { log("  ⚠ Digital Product service not found, skipping") } else {
      const data = [
        {
          tenant_id: T,
          name: "Saudi Business Startup Guide",
          handle: "saudi-startup-guide",
          type: "ebook",
          description: "Comprehensive guide to starting a business in Saudi Arabia, covering legal requirements, ZATCA compliance, and market entry strategies",
          price: sarPrice(79),
          currency_code: "sar",
          file_type: "pdf",
          file_size_mb: 15,
          thumbnail: getThumb("digital", 0),
          is_active: true,
          metadata: { seeded: true, pages: 120 },
        },
        {
          tenant_id: T,
          name: "Advanced Arabic Programming Course Access",
          handle: "arabic-programming-course",
          type: "course",
          description: "12-month access to comprehensive Arabic-language programming course covering Python, JavaScript, and cloud computing",
          price: sarPrice(499),
          currency_code: "sar",
          file_type: "access_key",
          duration_days: 365,
          thumbnail: getThumb("digital", 1),
          is_active: true,
          metadata: { seeded: true, lessons: 120, language: "ar" },
        },
        {
          tenant_id: T,
          name: "CityOS Business Analytics License",
          handle: "cityos-analytics-license",
          type: "software_license",
          description: "Annual license for CityOS Business Analytics suite with real-time dashboards and AI-powered insights",
          price: sarPrice(1999),
          currency_code: "sar",
          file_type: "license_key",
          duration_days: 365,
          thumbnail: getThumb("digital", 2),
          is_active: true,
          metadata: { seeded: true, seats: 5 },
        },
      ]
      await tryCreate(svc, data, ["createDigitalProducts", "create"])
      log("  ✓ Digital Product: 3 products created (ebook, course, license)")
    }
  } catch (err: any) { logError("Digital Product", err) }

  // ── SOCIAL COMMERCE ──
  try {
    const svc = resolveAny("socialCommerce", "social_commerce", "social-commerce", "socialCommerceModuleService")
    if (!svc) { log("  ⚠ Social Commerce service not found, skipping") } else {
      const data = [
        {
          tenant_id: T,
          author_id: "ven_seed_01",
          author_type: "vendor",
          content: "🎉 New arrivals! Check out our latest electronics collection featuring the newest smartphones and accessories. Shop now and get free delivery! #DakkahDeals #Electronics",
          type: "product_showcase",
          product_ids: ["prod_seed_01"],
          image_urls: [getImage("electronics", 0), getImage("electronics", 1)],
          likes_count: 245,
          shares_count: 32,
          comments_count: 18,
          is_active: true,
          metadata: { seeded: true },
        },
        {
          tenant_id: T,
          author_id: "ven_seed_01",
          author_type: "vendor",
          content: "Ramadan Kareem! 🌙 Special iftar deals on our restaurant partners. Order now through Dakkah for exclusive discounts. #RamadanKareem #DakkahFood",
          type: "promotion",
          image_urls: [getImage("food", 0), getImage("food", 1)],
          likes_count: 892,
          shares_count: 156,
          comments_count: 67,
          is_active: true,
          metadata: { seeded: true },
        },
        {
          tenant_id: T,
          author_id: "cus_seed_01",
          author_type: "customer",
          content: "Just received my order from Dakkah! Amazing quality and super fast delivery. The packaging was perfect too. Highly recommend! ⭐⭐⭐⭐⭐ #HappyCustomer",
          type: "review",
          image_urls: [getImage("fashion", 0)],
          likes_count: 78,
          shares_count: 5,
          comments_count: 12,
          is_active: true,
          metadata: { seeded: true },
        },
      ]
      await tryCreate(svc, data, ["createSocialCommercePosts", "createSocialCommerces", "create"])
      log("  ✓ Social Commerce: 3 posts created")
    }
  } catch (err: any) { logError("Social Commerce", err) }

  // ── PROMOTION EXT ──
  try {
    const svc = resolveAny("promotionExt", "promotion_ext", "promotion-ext", "promotionExtModuleService")
    if (!svc) { log("  ⚠ Promotion Ext service not found, skipping") } else {
      const startsAt = new Date()
      const endsAt = new Date()
      endsAt.setMonth(endsAt.getMonth() + 1)
      const data = [
        {
          tenant_id: T,
          name: "Summer Electronics Sale",
          handle: "summer-electronics-sale",
          type: "discount",
          description: "Up to 40% off on selected electronics this summer",
          discount_type: "percentage",
          discount_value: 40,
          min_order_amount: sarPrice(200),
          max_discount_amount: sarPrice(500),
          starts_at: startsAt.toISOString(),
          ends_at: endsAt.toISOString(),
          is_active: true,
          thumbnail: getThumb("electronics", 3),
          metadata: { seeded: true },
        },
        {
          tenant_id: T,
          name: "Tech Essentials Bundle",
          handle: "tech-essentials-bundle",
          type: "bundle",
          description: "Get laptop + monitor + accessories at a special bundle price",
          discount_type: "fixed",
          discount_value: sarPrice(500),
          product_ids: ["prod_seed_01", "prod_seed_02", "prod_seed_03"],
          starts_at: startsAt.toISOString(),
          ends_at: endsAt.toISOString(),
          is_active: true,
          thumbnail: getThumb("electronics", 4),
          metadata: { seeded: true },
        },
        {
          tenant_id: T,
          name: "New Customer Welcome",
          handle: "new-customer-welcome",
          type: "discount",
          description: "Welcome discount for new Dakkah customers - 15% off first order",
          discount_type: "percentage",
          discount_value: 15,
          max_uses: 1,
          max_discount_amount: sarPrice(200),
          starts_at: startsAt.toISOString(),
          ends_at: endsAt.toISOString(),
          is_active: true,
          metadata: { seeded: true, first_order_only: true },
        },
      ]
      await tryCreate(svc, data, ["createPromotionExts", "createPromotions", "create"])
      log("  ✓ Promotion Ext: 3 promotions created")
    }
  } catch (err: any) { logError("Promotion Ext", err) }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)
  log(`\n✅ Seed All With Images completed in ${elapsed}s`)
}
