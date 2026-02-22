import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "zod"
import { handleApiError } from "../../../../../lib/api-error-handler"

const submitPurchaseOrderSchema = z.object({})

/**
 * POST /store/purchase-orders/:id/submit
 * Submit purchase order for approval
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const companyModule = req.scope.resolve("company") as any
  const { id } = req.params
  
  if (!req.auth_context?.actor_id) {
    return res.status(401).json({ message: "Authentication required" })
  }
  
  const customerId = req.auth_context.actor_id
  
  try {
    const parsed = submitPurchaseOrderSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ message: "Validation failed", errors: parsed.error.issues })
    }

    const purchaseOrder = await companyModule.retrievePurchaseOrder(id, {
      relations: ["items"],
    })
    
    // Verify ownership
    if (purchaseOrder.customer_id !== customerId) {
      return res.status(403).json({ message: "Access denied" })
    }
    
    // Only draft POs can be submitted
    if (purchaseOrder.status !== "draft") {
      return res.status(400).json({ 
        message: "Only draft purchase orders can be submitted" 
      })
    }
    
    // Verify PO has items
    const items = purchaseOrder.items || []
    if (items.length === 0) {
      return res.status(400).json({ 
        message: "Purchase order must have at least one item" 
      })
    }
    
    // Get company to check approval requirements
    const company = await companyModule.retrieveCompany(purchaseOrder.company_id)
    
    // Check if auto-approval is possible based on spending limits
    const poTotal = Number(purchaseOrder.total)
    let newStatus = "pending_approval"
    
    // Check employee spending limit
    if (purchaseOrder.employee_id) {
      const employees = await companyModule.listCompanyEmployees({
        id: purchaseOrder.employee_id,
      })
      
      const employeeList = Array.isArray(employees) ? employees : [employees].filter(Boolean)
      
      if (employeeList.length > 0) {
        const employee = employeeList[0]
        const spendingLimit = Number(employee.spending_limit || 0)
        
        // If employee has approval rights and within limit, auto-approve
        if (employee.can_approve_orders && poTotal <= spendingLimit) {
          newStatus = "approved"
        }
      }
    }
    
    // Update PO status
    const updatedPO = await companyModule.updatePurchaseOrders({
      id,
      status: newStatus,
      submitted_at: new Date(),
      ...(newStatus === "approved" ? { approved_at: new Date() } : {}),
    })
    
    res.json({
      purchase_order: updatedPO,
      message: newStatus === "approved" 
        ? "Purchase order approved automatically"
        : "Purchase order submitted for approval",
    })
  } catch (error: any) {
    return handleApiError(res, error, "STORE-PURCHASE-ORDERS-ID-SUBMIT")
  }
}

