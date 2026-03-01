import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { handleApiError } from "../../../../lib/api-error-handler"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const query = req.scope.resolve("query") as unknown as any
  
    const { vendor_id, status, limit = "50", offset = "0" } = req.query as {
      vendor_id?: string
      status?: string
      limit?: string
      offset?: string
    }
  
    // Get payouts as commission transactions
    const filters: Record<string, any> = {}
    if (vendor_id) filters.vendor_id = vendor_id
    if (status) filters.status = status
  
    const { data: payouts } = await query.graph({
      entity: "payout",
      fields: [
        "id",
        "vendor_id",
        "amount",
        "currency",
        "status",
        "payout_method",
        "reference",
        "notes",
        "processed_at",
        "created_at",
      ],
      filters,
      pagination: {
        skip: parseInt(offset),
        take: parseInt(limit),
      },
    })
  
    // Get vendors for names
    const vendorIds = [...new Set(payouts.map((p: any) => p.vendor_id))]
    const { data: vendors } = await query.graph({
      entity: "vendor",
      fields: ["id", "store_name"],
      filters: vendorIds.length > 0 ? { id: vendorIds } : { id: "none" },
    })
  
    const vendorMap = new Map(vendors.map((v: any) => [v.id, v.store_name]))
  
    // Enrich payouts with vendor names
    const transactions = payouts.map((payout: any) => ({
      ...payout,
      vendor_name: vendorMap.get(payout.vendor_id) || "Unknown Vendor",
    }))
  
    // Calculate summary stats
    const { data: allPayouts } = await query.graph({
      entity: "payout",
      fields: ["amount", "status"],
      filters: vendor_id ? { vendor_id } : {},
    })
  
    const summary = {
      total_transactions: allPayouts.length,
      total_amount: allPayouts.reduce((sum: number, p: any) => sum + parseFloat(p.amount || "0"), 0),
      completed_amount: allPayouts
        .filter((p: any) => p.status === "completed")
        .reduce((sum: number, p: any) => sum + parseFloat(p.amount || "0"), 0),
      pending_amount: allPayouts
        .filter((p: any) => p.status === "pending")
        .reduce((sum: number, p: any) => sum + parseFloat(p.amount || "0"), 0),
      failed_amount: allPayouts
        .filter((p: any) => p.status === "failed")
        .reduce((sum: number, p: any) => sum + parseFloat(p.amount || "0"), 0),
    }
  
    res.json({
      transactions,
      summary,
      count: allPayouts.length,
      limit: parseInt(limit),
      offset: parseInt(offset),
    })

  } catch (error: unknown) {
    handleApiError(res, error, "GET admin commissions transactions")}
}

