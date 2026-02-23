// @ts-nocheck
import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { Modules } from "@medusajs/framework/utils"
import { subscriberLogger } from "../lib/logger"
import { appConfig } from "../lib/config"

const logger = subscriberLogger

export default async function purchaseOrderSubmittedHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string; company_id?: string }>) {
  const notificationService = container.resolve(Modules.NOTIFICATION)
  const purchaseOrderService = container.resolve("purchaseOrder")
  
  try {
    const po = await purchaseOrderService.retrievePurchaseOrder(data.id)
    
    if (po?.company?.email && appConfig.features.enableEmailNotifications) {
      await notificationService.createNotifications({
        to: po.company.email,
        channel: "email",
        template: "purchase-order-submitted",
        data: {
          po_number: po.po_number,
          company_name: po.company.name,
          total: po.total,
          status: po.status,
          view_url: `${appConfig.urls.storefront}/business/purchase-orders/${po.id}`,
        }
      })
    }
    
    if (appConfig.features.enableAdminNotifications) {
      await notificationService.createNotifications({
        to: "",
        channel: "feed",
        template: "admin-ui",
        data: {
          title: "New Purchase Order",
          description: `PO ${po?.po_number} submitted by ${po?.company?.name}`,
        }
      })
    }
    
    logger.info("Purchase order submitted notification sent", { 
      poId: data.id, 
      companyId: data.company_id 
    })
  } catch (error) {
    logger.error("Purchase order submitted handler error", error, { poId: data.id })
  }
}

export const config: SubscriberConfig = {
  event: "purchase_order.submitted",
}
