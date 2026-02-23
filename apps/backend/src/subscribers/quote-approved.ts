import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { Modules } from "@medusajs/framework/utils"
import { subscriberLogger } from "../lib/logger"
import { appConfig } from "../lib/config"

const logger = subscriberLogger

export default async function quoteApprovedHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const notificationService = container.resolve(Modules.NOTIFICATION)
  const quoteService = container.resolve("quote")

  try {
    const quote = await quoteService.retrieveQuote(data.id)
    
    if (!quote) {
      logger.warn("Quote not found", { quoteId: data.id })
      return
    }

    const customerEmail = quote.company?.email || quote.metadata?.email

    if (customerEmail && appConfig.features.enableEmailNotifications) {
      await notificationService.createNotifications({
        to: customerEmail,
        channel: "email",
        template: "quote-approved",
        data: {
          quote_number: quote.quote_number,
          company_name: quote.company?.name || "Customer",
          total: quote.total,
          valid_until: quote.valid_until,
          view_url: `${appConfig.urls.storefront}/business/quotes/${quote.id}`,
        },
      })
    }

    if (appConfig.features.enableAdminNotifications) {
      await notificationService.createNotifications({
        to: "",
        channel: "feed",
        template: "admin-ui",
        data: {
          title: "Quote Approved",
          description: `Quote ${quote.quote_number} has been approved and sent to customer`,
        },
      })
    }

    logger.info("Quote approved notification sent", { 
      quoteId: data.id, 
      email: customerEmail 
    })
  } catch (error) {
    logger.error("Quote approved handler error", error, { quoteId: data.id })
  }
}

export const config: SubscriberConfig = {
  event: "quote.approved",
}
