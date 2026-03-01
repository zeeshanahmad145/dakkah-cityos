import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { Modules } from "@medusajs/framework/utils"
import { subscriberLogger } from "../lib/logger"
import { appConfig } from "../lib/config"

const logger = subscriberLogger

export default async function payoutCompletedHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string; vendor_id: string }>) {
  const notificationService = container.resolve(Modules.NOTIFICATION) as unknown as any
  const query = container.resolve("query") as unknown as any
  
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
        template: "payout-completed",
        data: {
          vendor_name: vendor.name,
          payout_number: payout?.payout_number,
          amount: payout?.net_amount,
          currency: payout?.currency || "USD",
          arrival_estimate: "2-3 business days",
        }
      })
    }
    
    if (appConfig.features.enableAdminNotifications) {
      await notificationService.createNotifications({
        to: "",
        channel: "feed",
        template: "admin-ui",
        data: {
          title: "Payout Completed",
          description: `Payout ${payout?.payout_number} completed for ${vendor?.name}`,
        }
      })
    }
    
    logger.info("Payout completed notification sent", { 
      payoutId: data.id, 
      vendorId: data.vendor_id 
    })
  } catch (error) {
    logger.error("Payout completed handler error", error, { payoutId: data.id })
  }
}

export const config: SubscriberConfig = {
  event: "payout.completed",
}
