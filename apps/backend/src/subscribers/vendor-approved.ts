import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { Modules } from "@medusajs/framework/utils"
import { subscriberLogger } from "../lib/logger"
import { appConfig } from "../lib/config"

const logger = subscriberLogger

export default async function vendorApprovedHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const notificationService = container.resolve(Modules.NOTIFICATION)
  const query = container.resolve("query")

  try {
    const { data: vendors } = await query.graph({
      entity: "vendor",
      fields: ["*"],
      filters: { id: data.id },
    })

    const vendor = vendors[0]
    if (!vendor) {
      logger.warn("Vendor not found", { vendorId: data.id })
      return
    }

    if (vendor.contact_email && appConfig.features.enableEmailNotifications) {
      await notificationService.createNotifications({
        to: vendor.contact_email,
        channel: "email",
        template: "vendor-approved",
        data: {
          vendor_name: vendor.name,
          dashboard_url: `${appConfig.urls.storefront}/vendor/dashboard`,
          next_steps: "You can now start adding products to your store",
        },
      })
    }

    if (appConfig.features.enableAdminNotifications) {
      await notificationService.createNotifications({
        to: "",
        channel: "feed",
        template: "admin-ui",
        data: {
          title: "Vendor Approved",
          description: `Vendor "${vendor.name}" has been approved`,
        },
      })
    }

    logger.info("Vendor approved notification sent", { 
      vendorId: data.id, 
      email: vendor.contact_email 
    })
  } catch (error) {
    logger.error("Vendor approved handler error", error, { vendorId: data.id })
  }
}

export const config: SubscriberConfig = {
  event: "vendor.approved",
}
