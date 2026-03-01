import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { Modules } from "@medusajs/framework/utils"
import { subscriberLogger } from "../lib/logger"
import { appConfig } from "../lib/config"

const logger = subscriberLogger

export default async function vendorSuspendedHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string; reason?: string }>) {
  const notificationService = container.resolve(Modules.NOTIFICATION) as unknown as any
  const query = container.resolve("query") as unknown as any
  
  try {
    const { data: vendors } = await query.graph({
      entity: "vendor",
      fields: ["*"],
      filters: { id: data.id }
    })
    
    const vendor = vendors?.[0]
    
    if (vendor?.contact_email && appConfig.features.enableEmailNotifications) {
      await notificationService.createNotifications({
        to: vendor.contact_email,
        channel: "email",
        template: "vendor-suspended",
        data: {
          vendor_name: vendor.name,
          reason: data.reason || "Policy violation",
          appeal_url: `${appConfig.urls.storefront}/vendor/appeal`,
          support_email: appConfig.emails.support,
        }
      })
    }
    
    if (appConfig.features.enableAdminNotifications) {
      await notificationService.createNotifications({
        to: "",
        channel: "feed",
        template: "admin-ui",
        data: {
          title: "Vendor Suspended",
          description: `Vendor "${vendor?.name}" has been suspended: ${data.reason || "Policy violation"}`,
        }
      })
    }
    
    logger.info("Vendor suspended notification sent", { 
      vendorId: data.id, 
      vendorName: vendor?.name,
      reason: data.reason 
    })
  } catch (error) {
    logger.error("Vendor suspended handler error", error, { vendorId: data.id })
  }
}

export const config: SubscriberConfig = {
  event: "vendor.suspended",
}
