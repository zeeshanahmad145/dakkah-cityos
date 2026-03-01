import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { Modules } from "@medusajs/framework/utils"
import { subscriberLogger } from "../lib/logger"
import { appConfig } from "../lib/config"

const logger = subscriberLogger

export default async function companyCreatedHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const notificationService = container.resolve(Modules.NOTIFICATION) as unknown as any
  const companyService = container.resolve("company") as unknown as any
  
  try {
    const company = await companyService.retrieveCompany(data.id)
    
    if (company?.email && appConfig.features.enableEmailNotifications) {
      await notificationService.createNotifications({
        to: company.email,
        channel: "email",
        template: "company-welcome",
        data: {
          company_name: company.name,
          dashboard_url: `${appConfig.urls.storefront}/business/dashboard`,
          features: ["Request quotes", "Manage team", "Track orders", "Volume pricing"],
        }
      })
    }
    
    if (appConfig.features.enableAdminNotifications) {
      await notificationService.createNotifications({
        to: "",
        channel: "feed",
        template: "admin-ui",
        data: {
          title: "New B2B Company",
          description: `New B2B company registered: ${company?.name}`,
        }
      })
    }
    
    logger.info("Company created notification sent", { 
      companyId: data.id, 
      email: company?.email 
    })
  } catch (error) {
    logger.error("Company created handler error", error, { companyId: data.id })
  }
}

export const config: SubscriberConfig = {
  event: "company.created",
}
