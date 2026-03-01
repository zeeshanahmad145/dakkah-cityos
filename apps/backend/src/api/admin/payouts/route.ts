import { MedusaRequest, MedusaResponse } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { handleApiError } from "../../../lib/api-error-handler"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY) as unknown as any
  
  try {
    const { 
      limit = "20", 
      offset = "0", 
      status,
      vendor_id,
      sort = "created_at",
      order = "DESC"
    } = req.query as Record<string, string>
    
    const filters: Record<string, any> = {}
    if (status) filters.status = status
    if (vendor_id) filters.vendor_id = vendor_id
    
    const { data: payouts, metadata } = await query.graph({
      entity: "payout",
      fields: ["*", "vendor.*"],
      filters,
      pagination: {
        skip: Number(offset),
        take: Number(limit),
        order: { [sort]: order.toUpperCase() as "ASC" | "DESC" }
      }
    })
    
    res.json({
      payouts,
      count: metadata?.count || payouts.length,
      limit: Number(limit),
      offset: Number(offset)
    })
  } catch (error: unknown) {
    handleApiError(res, error, "ADMIN-PAYOUTS")}
}

