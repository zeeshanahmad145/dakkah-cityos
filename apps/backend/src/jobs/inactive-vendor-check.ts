// @ts-nocheck
import { MedusaContainer } from "@medusajs/framework/types"
import { createLogger } from "../lib/logger"
const logger = createLogger("jobs:inactive-vendor-check")

export default async function inactiveVendorCheckJob(container: MedusaContainer) {
  const query = container.resolve("query") as unknown as any
  const vendorService = container.resolve("vendor") as unknown as any
  const eventBus = container.resolve("event_bus") as unknown as any
  
  logger.info("[Inactive Vendor Check] Checking for inactive vendors...")
  
  try {
    const ninetyDaysAgo = new Date()
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)
    
    const { data: activeVendors } = await query.graph({
      entity: "vendor",
      fields: ["id", "business_name", "email", "status", "metadata"],
      filters: {
        status: "active"
      }
    })
    
    if (!activeVendors || activeVendors.length === 0) {
      logger.info("[Inactive Vendor Check] No active vendors found")
      return
    }
    
    let warningCount = 0
    let deactivatedCount = 0
    
    for (const vendor of activeVendors) {
      const lastOrderAt = vendor.metadata?.last_order_at ? new Date(vendor.metadata.last_order_at) : null
      const warningsSent = vendor.metadata?.inactivity_warnings || 0
      
      if (lastOrderAt && lastOrderAt > ninetyDaysAgo) {
        continue
      }
      
      const vendorAge = vendor.metadata?.created_at 
        ? Date.now() - new Date(vendor.metadata.created_at).getTime()
        : Infinity
      
      if (!lastOrderAt && vendorAge < 90 * 24 * 60 * 60 * 1000) {
        continue
      }
      
      if (warningsSent >= 2) {
        await vendorService.updateVendors({
          id: vendor.id,
          status: "inactive",
          metadata: {
            ...vendor.metadata,
            deactivated_at: new Date().toISOString(),
            deactivation_reason: "prolonged_inactivity"
          }
        })
        
        await eventBus.emit("vendor.deactivated", {
          id: vendor.id,
          reason: "prolonged_inactivity"
        })
        
        deactivatedCount++
        logger.info(`[Inactive Vendor Check] Deactivated vendor: ${vendor.business_name}`)
      } else {
        await vendorService.updateVendors({
          id: vendor.id,
          metadata: {
            ...vendor.metadata,
            inactivity_warnings: warningsSent + 1,
            last_inactivity_warning: new Date().toISOString()
          }
        })
        
        await eventBus.emit("vendor.inactivity_warning", {
          id: vendor.id,
          warning_number: warningsSent + 1
        })
        
        warningCount++
        logger.info(`[Inactive Vendor Check] Warning ${warningsSent + 1} sent to: ${vendor.business_name}`)
      }
    }
    
    logger.info(`[Inactive Vendor Check] Completed - Warnings: ${warningCount}, Deactivated: ${deactivatedCount}`)
  } catch (error) {
    logger.error("[Inactive Vendor Check] Job failed:", error)
  }
}

export const config = {
  name: "inactive-vendor-check",
  schedule: "0 6 * * 1", // Weekly on Monday at 6 AM
}
