// @ts-nocheck
import { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

export default async function createDakkahTenant({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)

  try {
    const svc = container.resolve("tenant") as any

    const existing = await svc.listTenants({ slug: "dakkah" })
    const list = Array.isArray(existing) ? existing : [existing].filter(Boolean)

    if (list.length > 0 && list[0]?.id) {
      logger.info("Dakkah tenant already exists: " + list[0].id)
      return
    }

    const t = await svc.createTenants({
      name: "Dakkah",
      slug: "dakkah",
      handle: "dakkah",
      domain: "dakkah.sa",
      residency_zone: "MENA",
      country_id: "sa",
      default_locale: "ar",
      supported_locales: ["ar", "en", "fr"],
      timezone: "Asia/Riyadh",
      default_currency: "sar",
      date_format: "DD/MM/YYYY",
      status: "active",
      subscription_tier: "enterprise",
      scope_tier: "mega",
      tenant_type: "platform",
      max_pois: 1000,
      max_channels: 50,
      can_host_vendors: true,
      primary_color: "#1a5f2a",
      accent_color: "#d4af37",
      settings: {
        features: {
          b2b: true,
          bookings: true,
          multi_vendor: true,
          subscriptions: true,
          digital_products: true,
          classifieds: true,
          auctions: true,
          rentals: true,
        },
      },
      metadata: { seeded: true },
    })
    logger.info("Created Dakkah tenant: " + t.id)
  } catch (err: any) {
    logger.error("Failed to create tenant: " + err.message)
    logger.error(err.stack)
  }
}
