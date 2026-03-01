import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { handleApiError } from "../../../../lib/api-error-handler"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const query = req.scope.resolve("query") as unknown as any
  
  const { vendor_id, start_date, end_date } = req.query as {
    vendor_id?: string
    start_date?: string
    end_date?: string
  }
  
  // Get all vendors with their analytics
  const { data: vendors } = await query.graph({
    entity: "vendor",
    fields: [
      "id",
      "store_name",
      "status",
      "commission_rate",
      "total_sales",
      "total_orders",
      "average_rating",
      "total_reviews",
      "created_at",
    ],
    filters: vendor_id ? { id: vendor_id } : {},
  })
  
  // Get vendor analytics snapshots if available
  let analyticsData: any[] = []
  try {
    const { data: snapshots } = await query.graph({
      entity: "vendor_analytics_snapshot",
      fields: ["*"],
      filters: vendor_id ? { vendor_id } : {},
    })
    analyticsData = snapshots
  } catch {
    // Analytics snapshots may not exist
  }
  
  // Get payouts summary
  const { data: payouts } = await query.graph({
    entity: "payout",
    fields: ["id", "vendor_id", "amount", "status", "created_at"],
    filters: vendor_id ? { vendor_id } : {},
  })
  
  // Calculate aggregated stats
  const vendorStats = vendors.map((vendor: any) => {
    const vendorPayouts = payouts.filter((p: any) => p.vendor_id === vendor.id)
    const totalPaidOut = vendorPayouts
      .filter((p: any) => p.status === "completed")
      .reduce((sum: number, p: any) => sum + parseFloat(p.amount || "0"), 0)
    const pendingPayouts = vendorPayouts
      .filter((p: any) => p.status === "pending")
      .reduce((sum: number, p: any) => sum + parseFloat(p.amount || "0"), 0)
    
    return {
      ...vendor,
      total_paid_out: totalPaidOut,
      pending_payouts: pendingPayouts,
      payout_count: vendorPayouts.length,
    }
  })
  
  // Calculate platform-wide stats
  const platformStats = {
    total_vendors: vendors.length,
    active_vendors: vendors.filter((v: any) => v.status === "active").length,
    total_gmv: vendors.reduce((sum: number, v: any) => sum + parseFloat(v.total_sales || "0"), 0),
    total_orders: vendors.reduce((sum: number, v: any) => sum + (v.total_orders || 0), 0),
    total_paid_out: payouts
      .filter((p: any) => p.status === "completed")
      .reduce((sum: number, p: any) => sum + parseFloat(p.amount || "0"), 0),
    pending_payouts: payouts
      .filter((p: any) => p.status === "pending")
      .reduce((sum: number, p: any) => sum + parseFloat(p.amount || "0"), 0),
  }
  
  res.json({
    vendors: vendorStats,
    platform_stats: platformStats,
    analytics_snapshots: analyticsData,
  })
}

