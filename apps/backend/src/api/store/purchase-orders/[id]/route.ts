import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { handleApiError } from "../../../../lib/api-error-handler"
import { enrichDetailItem } from "../../../../lib/detail-enricher"

/**
 * GET /store/purchase-orders/:id
 * Get purchase order details
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const companyModule = req.scope.resolve("company") as any
  const { id } = req.params
  
  if (!req.auth_context?.actor_id) {
    return res.status(401).json({ message: "Authentication required" })
  }
  
  const customerId = req.auth_context.actor_id
  
  try {
    const purchaseOrder = await companyModule.retrievePurchaseOrder(id, {
      relations: ["items", "company"],
    })
    
    // Verify ownership (customer created it or is part of the company)
    if (purchaseOrder.customer_id !== customerId) {
      // Check if customer is part of the company
      const employees = await companyModule.listCompanyEmployees({
        company_id: purchaseOrder.company_id,
        customer_id: customerId,
      })
      
      const employeeList = Array.isArray(employees) ? employees : [employees].filter(Boolean)
      
      if (employeeList.length === 0) {
        return res.status(403).json({ message: "Access denied" })
      }
    }
    
    res.json({ purchase_order: enrichDetailItem(purchaseOrder, "b2b") })
  } catch (error: any) {
    return handleApiError(res, error, "STORE-PURCHASE-ORDERS-ID")
  }
}

/**
 * DELETE /store/purchase-orders/:id
 * Cancel a purchase order (only if draft)
 */
export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  const companyModule = req.scope.resolve("company") as any
  const { id } = req.params
  
  if (!req.auth_context?.actor_id) {
    return res.status(401).json({ message: "Authentication required" })
  }
  
  const customerId = req.auth_context.actor_id
  
  try {
    const purchaseOrder = await companyModule.retrievePurchaseOrder(id)
    
    // Verify ownership
    if (purchaseOrder.customer_id !== customerId) {
      return res.status(403).json({ message: "Access denied" })
    }
    
    // Only draft POs can be cancelled
    if (purchaseOrder.status !== "draft") {
      return res.status(400).json({ 
        message: "Only draft purchase orders can be cancelled" 
      })
    }
    
    await companyModule.updatePurchaseOrders({
      id,
      status: "cancelled",
      cancelled_at: new Date(),
    })
    
    res.json({ message: "Purchase order cancelled" })
  } catch (error: any) {
    return handleApiError(res, error, "STORE-PURCHASE-ORDERS-ID")
  }
}

