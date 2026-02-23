import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { Modules } from "@medusajs/framework/utils"
import { subscriberLogger } from "../lib/logger"
import { appConfig } from "../lib/config"

const logger = subscriberLogger

export default async function payoutFailedHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string; vendor_id: string; error?: string }>) {
  const notificationService = container.resolve(Modules.NOTIFICATION)
  const query = container.resolve("query")
  
  try {
    const { data: vendors } = await query.graph({
      entity: "vendor",
      fields: ["*"],
      filters: { id: data.vendor_id }
    })
    
    const vendor = vendors?.[0]
    
    const { data: payouts } = await query.graph({
      entity: "payout",
      fields: ["*"],
      filters: { id: data.id }
    })
    
    const payout = payouts?.[0]
    
    if (vendor?.contact_email && appConfig.features.enableEmailNotifications) {
      await notificationService.createNotifications({
        to: vendor.contact_email,
        channel: "email",
        template: "payout-failed",
        data: {
          vendor_name: vendor.name,
          payout_number: payout?.payout_number,
          amount: payout?.net_amount,
          error: data.error || "Payout could not be processed",
          retry_info: "We will automatically retry in 24 hours",
          update_payment_url: `${appConfig.urls.storefront}/vendor/settings/payments`,
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
          title: "Payout Failed",
          description: `Payout ${payout?.payout_number} failed for ${vendor?.name}: ${data.error}`,
        }
      })
    }
    
    logger.info("Payout failed notification sent", { 
      payoutId: data.id, 
      vendorId: data.vendor_id,
      error: data.error 
    })
  } catch (error) {
    logger.error("Payout failed handler error", error, { payoutId: data.id })
  }
}

export const config: SubscriberConfig = {
  event: "payout.failed",
}
