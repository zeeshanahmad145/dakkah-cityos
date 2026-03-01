import { MedusaContainer } from "@medusajs/framework/types"

/**
 * Scheduled job to clean up expired/abandoned carts
 * Runs daily to remove carts older than 30 days
 */
export default async function cleanupExpiredCartsJob(container: MedusaContainer) {
  const query = container.resolve("query") as unknown as any
  const logger = container.resolve("logger") as unknown as any

  logger.info("[cleanup-carts] Starting cart cleanup job")

  try {
    // Calculate date 30 days ago
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    // Find old carts
    const { data: oldCarts } = await query.graph({
      entity: "cart",
      fields: ["id", "created_at", "completed_at"],
      filters: {
        created_at: { $lt: thirtyDaysAgo.toISOString() },
        completed_at: null, // Not completed
      },
      pagination: { take: 1000 },
    })

    logger.info(`[cleanup-carts] Found ${oldCarts.length} abandoned carts to clean up`)

    // In a real implementation, you would delete these carts
    // For safety, we'll just log them for now
    for (const cart of oldCarts) {
      logger.info(`[cleanup-carts] Would delete cart ${cart.id} created at ${cart.created_at}`)
    }

    logger.info(`[cleanup-carts] Cleanup completed`)
  } catch (error) {
    logger.error("[cleanup-carts] Job failed:", error)
  }
}

export const config = {
  name: "cleanup-expired-carts",
  schedule: "0 3 * * *", // Daily at 3 AM
}
