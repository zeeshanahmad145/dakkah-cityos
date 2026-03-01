// @ts-nocheck
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { handleApiError } from "../../../../../lib/api-error-handler"

// GET - Get vendor performance metrics
export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
) {
  try {
    const { id } = req.params
    const { period = "30d" } = req.query as { period?: string }

    const query = req.scope.resolve("query") as unknown as any

    // Calculate date range
    const now = new Date()
    let startDate: Date
    switch (period) {
      case "7d":
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case "30d":
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        break
      case "90d":
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
        break
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    }

    // Get vendor details
    const { data: vendors } = await query.graph({
      entity: "vendors",
      fields: ["id", "name", "created_at", "status"],
      filters: { id }
    })

    if (!vendors.length) {
      return res.status(404).json({ message: "Vendor not found" })
    }

    // Get orders for this vendor
    const { data: orders } = await query.graph({
      entity: "order",
      fields: ["id", "status", "total", "created_at", "fulfillment_status", "items.*"],
      filters: {
        vendor_id: id,
        created_at: { $gte: startDate.toISOString() }
      }
    })

    // Get reviews for this vendor
    const { data: reviews } = await query.graph({
      entity: "review",
      fields: ["id", "rating", "created_at"],
      filters: {
        vendor_id: id,
        status: "approved",
        created_at: { $gte: startDate.toISOString() }
      }
    })

    // Calculate metrics
    const totalOrders = orders.length
    const completedOrders = orders.filter((o: any) => o.status === "completed")
    const cancelledOrders = orders.filter((o: any) => o.status === "cancelled")
    const pendingOrders = orders.filter((o: any) => o.status === "pending")

    const totalRevenue = completedOrders.reduce((sum: number, o: any) => sum + o.total, 0)
    const averageOrderValue = completedOrders.length > 0 ? totalRevenue / completedOrders.length : 0

    const fulfillmentRate = totalOrders > 0 
      ? (completedOrders.length / totalOrders) * 100 
      : 0

    const cancellationRate = totalOrders > 0 
      ? (cancelledOrders.length / totalOrders) * 100 
      : 0

    // Calculate average fulfillment time (if data available)
    let avgFulfillmentTime = 0
    const fulfilledOrders = orders.filter((o: any) => o.fulfilled_at && o.created_at)
    if (fulfilledOrders.length > 0) {
      const totalTime = fulfilledOrders.reduce((sum: number, o: any) => {
        return sum + (new Date(o.fulfilled_at).getTime() - new Date(o.created_at).getTime())
      }, 0)
      avgFulfillmentTime = totalTime / fulfilledOrders.length / (1000 * 60 * 60) // in hours
    }

    // Review metrics
    const totalReviews = reviews.length
    const averageRating = reviews.length > 0
      ? reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / reviews.length
      : 0

    // Response rate (placeholder - would need message/inquiry data)
    const responseRate = 95 // Placeholder

    // Calculate performance score (0-100)
    const performanceScore = Math.round(
      (fulfillmentRate * 0.3) +
      ((100 - cancellationRate) * 0.2) +
      (averageRating * 20 * 0.3) +
      (responseRate * 0.2)
    )

    res.json({
      vendor_id: id,
      period,
      metrics: {
        orders: {
          total: totalOrders,
          completed: completedOrders.length,
          cancelled: cancelledOrders.length,
          pending: pendingOrders.length
        },
        revenue: {
          total: totalRevenue,
          average_order_value: Math.round(averageOrderValue * 100) / 100
        },
        fulfillment: {
          rate: Math.round(fulfillmentRate * 10) / 10,
          average_time_hours: Math.round(avgFulfillmentTime * 10) / 10,
          cancellation_rate: Math.round(cancellationRate * 10) / 10
        },
        reviews: {
          total: totalReviews,
          average_rating: Math.round(averageRating * 10) / 10
        },
        response_rate: responseRate,
        performance_score: performanceScore
      }
    })

  } catch (error: unknown) {
    handleApiError(res, error, "GET admin vendors id performance")}
}

