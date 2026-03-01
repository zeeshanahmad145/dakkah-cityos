import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { Modules } from "@medusajs/framework/utils"
import { subscriberLogger } from "../lib/logger"
import { appConfig } from "../lib/config"

const logger = subscriberLogger

export default async function quoteAcceptedHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const notificationService = container.resolve(Modules.NOTIFICATION) as unknown as any
  const quoteService = container.resolve("quote") as unknown as any
  
  try {
    const quote = await quoteService.retrieveQuote(data.id)
    
    if (appConfig.features.enableAdminNotifications) {
      await notificationService.createNotifications({
        to: "",
        channel: "feed",
        template: "admin-ui",
        data: {
          title: "Quote Accepted",
          description: `Quote ${quote?.quote_number} accepted by ${quote?.company?.name || "customer"}`,
        }
      })
    }
    
    logger.info("Quote accepted notification sent", { quoteId: data.id })
  } catch (error) {
    logger.error("Quote accepted handler error", error, { quoteId: data.id })
  }
}

export const config: SubscriberConfig = {
  event: "quote.accepted",
}
