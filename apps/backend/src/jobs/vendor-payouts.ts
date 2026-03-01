// @ts-nocheck
import { MedusaContainer } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"

export default async function vendorPayoutsJob(container: MedusaContainer) {
  const payoutService = container.resolve("payout") as unknown as any
  const vendorService = container.resolve("vendor") as unknown as any
  const notificationService = container.resolve(Modules.NOTIFICATION) as unknown as any
  const logger = container.resolve("logger") as unknown as any

  logger.info("[vendor-payouts] Starting vendor payouts job")

  try {
    const vendors = await vendorService.listVendors({
      status: "active",
    })

    logger.info(`[vendor-payouts] Processing payouts for ${vendors.length} vendors`)

    let processedCount = 0
    let totalPayout = 0

    for (const vendor of vendors) {
      try {
        const pendingPayouts = await payoutService.listPayouts({
          vendor_id: vendor.id,
          status: "pending",
        })

        if (pendingPayouts.length === 0) {
          continue
        }

        const payoutAmount = pendingPayouts.reduce(
          (sum: number, p: any) => sum + (p.net_amount || 0),
          0
        )

        if (payoutAmount <= 0) {
          continue
        }

        const now = new Date()
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

        await payoutService.createPayouts({
          vendor_id: vendor.id,
          tenant_id: vendor.tenant_id,
          net_amount: payoutAmount,
          gross_amount: payoutAmount,
          commission_amount: 0,
          payout_number: `PO-${now.getFullYear()}-${vendor.id.slice(-6)}-${Date.now()}`,
          period_start: weekAgo,
          period_end: now,
          transaction_count: pendingPayouts.length,
          status: "processing",
          payment_method: vendor.payout_method || "stripe_connect",
          scheduled_for: now,
          metadata: {
            payout_count: pendingPayouts.length,
          },
        })

        for (const payout of pendingPayouts) {
          await payoutService.updatePayouts(
            { id: payout.id },
            { status: "completed" }
          )
        }

        if (vendor.email) {
          await notificationService.createNotifications({
            to: vendor.email,
            channel: "email",
            template: "vendor-payout-processed",
            data: {
              vendor_name: vendor.business_name,
              amount: payoutAmount,
            },
          })
        }

        processedCount++
        totalPayout += payoutAmount
        logger.info(`[vendor-payouts] Processed payout for vendor ${vendor.id}: ${payoutAmount}`)
      } catch (error: unknown) {
        logger.error(`[vendor-payouts] Failed to process payout for vendor ${vendor.id}:`, error)
      }
    }

    logger.info(`[vendor-payouts] Completed: ${processedCount} vendors, total payout: ${totalPayout}`)

    await notificationService.createNotifications({
      to: "",
      channel: "feed",
      template: "admin-ui",
      data: {
        title: "Weekly Vendor Payouts Processed",
        description: `Processed ${processedCount} vendor payouts totaling ${totalPayout}`,
      },
    })
  } catch (error) {
    logger.error("[vendor-payouts] Job failed:", error)
  }
}

export const config = {
  name: "vendor-payouts",
  schedule: "0 0 * * 1", // Every Monday at midnight
}
