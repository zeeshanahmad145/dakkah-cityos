// @ts-nocheck
import { MedusaContainer } from "@medusajs/framework/types"
import { createLogger } from "../lib/logger"
const logger = createLogger("jobs:subscription-renewal-reminder")

export default async function subscriptionRenewalReminderJob(container: MedusaContainer) {
  const query = container.resolve("query") as unknown as any
  const eventBus = container.resolve("event_bus") as unknown as any
  
  logger.info("[Renewal Reminder] Checking for upcoming renewals...")
  
  try {
    const now = new Date()
    
    const reminderDays = [7, 3]
    let totalReminders = 0
    
    for (const days of reminderDays) {
      const targetDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000)
      const dayStart = new Date(targetDate)
      dayStart.setHours(0, 0, 0, 0)
      const dayEnd = new Date(targetDate)
      dayEnd.setHours(23, 59, 59, 999)
      
      const { data: upcomingRenewals } = await query.graph({
        entity: "subscription",
        fields: ["*"],
        filters: {
          status: "active",
          current_period_end: {
            $gte: dayStart.toISOString(),
            $lt: dayEnd.toISOString()
          }
        }
      })
      
      for (const subscription of upcomingRenewals || []) {
        const reminderKey = `renewal_reminder_${days}d_sent`
        const currentPeriodEnd = subscription.current_period_end
        const lastReminderFor = subscription.metadata?.[`${reminderKey}_for`]
        
        if (lastReminderFor === currentPeriodEnd) {
          continue
        }
        
        await eventBus.emit("subscription.renewal_upcoming", {
          id: subscription.id,
          days_until_renewal: days
        })
        
        totalReminders++
        logger.info(`[Renewal Reminder] ${days}-day reminder sent for subscription ${subscription.id}`)
      }
    }
    
    logger.info(`[Renewal Reminder] Sent ${totalReminders} reminders`)
  } catch (error) {
    logger.error("[Renewal Reminder] Job failed:", error)
  }
}

export const config = {
  name: "subscription-renewal-reminder",
  schedule: "0 10 * * *", // Daily at 10 AM
}
