import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "zod"
import { handleApiError } from "../../../lib/api-error-handler"

const purchaseOrderItemSchema = z.object({
  product_id: z.string().min(1),
  variant_id: z.string().optional(),
  title: z.string().min(1),
  sku: z.string().optional(),
  quantity: z.number().min(1),
  unit_price: z.union([z.string(), z.number()]),
})

const createPurchaseOrderSchema = z.object({
  company_id: z.string().min(1),
  po_number: z.string().optional(),
  shipping_address_id: z.string().optional(),
  billing_address_id: z.string().optional(),
  items: z.array(purchaseOrderItemSchema).optional(),
  notes: z.string().optional(),
  requested_delivery_date: z.string().optional(),
})

/**
 * GET /store/purchase-orders
 * List customer's purchase orders
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const companyModule = req.scope.resolve("company") as any
  
  if (!req.auth_context?.actor_id) {
    return res.status(401).json({ message: "Authentication required" })
  }
  
  const customerId = req.auth_context.actor_id
  const { offset = 0, limit = 20, status } = req.query
  
  try {
    const filters: Record<string, unknown> = { customer_id: customerId }
    if (status) filters.status = status
    
    const purchaseOrders = await companyModule.listPurchaseOrders(filters, {
      skip: Number(offset),
      take: Number(limit),
      order: { created_at: "DESC" },
    })
    
    const poList = Array.isArray(purchaseOrders) ? purchaseOrders : [purchaseOrders].filter(Boolean)
    
    res.json({
      purchase_orders: poList,
      count: poList.length,
      offset: Number(offset),
      limit: Number(limit),
    })
  } catch (error: any) {
    handleApiError(res, error, "STORE-PURCHASE-ORDERS")}
}

/**
 * POST /store/purchase-orders
 * Create a new purchase order
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const companyModule = req.scope.resolve("company") as any
  
  if (!req.auth_context?.actor_id) {
    return res.status(401).json({ message: "Authentication required" })
  }
  
  const customerId = req.auth_context.actor_id

  const parsed = createPurchaseOrderSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ message: "Validation failed", errors: parsed.error.issues })
  }

  const {
    company_id,
    po_number,
    shipping_address_id,
    billing_address_id,
    items,
    notes,
    requested_delivery_date,
  } = parsed.data
  
  try {
    // Verify customer belongs to company
    const employees = await companyModule.listCompanyEmployees({ 
      company_id, 
      customer_id: customerId 
    })
    
    const employeeList = Array.isArray(employees) ? employees : [employees].filter(Boolean)
    
    if (employeeList.length === 0) {
      return res.status(403).json({ message: "You are not a member of this company" })
    }
    
    const employee = employeeList[0]
    
    // Generate PO number if not provided
    const generatedPoNumber = po_number || `PO-${Date.now().toString(36).toUpperCase()}`
    
    // Create purchase order
    const purchaseOrder = await companyModule.createPurchaseOrders({
      po_number: generatedPoNumber,
      company_id,
      customer_id: customerId,
      employee_id: employee.id,
      status: "draft",
      shipping_address_id,
      billing_address_id,
      notes,
      requested_delivery_date: requested_delivery_date ? new Date(requested_delivery_date) : null,
      subtotal: "0",
      tax_total: "0",
      shipping_total: "0",
      total: "0",
    })
    
    // Create line items if provided
    if (items && Array.isArray(items)) {
      let subtotal = 0
      
      for (const item of items) {
        await companyModule.createPurchaseOrderItems({
          purchase_order_id: purchaseOrder.id,
          product_id: item.product_id,
          variant_id: item.variant_id,
          title: item.title,
          sku: item.sku,
          quantity: item.quantity,
          unit_price: item.unit_price,
          subtotal: String(Number(item.quantity) * Number(item.unit_price)),
        })
        
        subtotal += Number(item.quantity) * Number(item.unit_price)
      }
      
      // Update totals
      await companyModule.updatePurchaseOrders({
        id: purchaseOrder.id,
        subtotal: String(subtotal),
        total: String(subtotal),
      })
    }
    
    // Fetch complete PO
    const completePO = await companyModule.retrievePurchaseOrder(purchaseOrder.id, {
      relations: ["items"],
    })
    
    res.status(201).json({ purchase_order: completePO })
  } catch (error: any) {
    return handleApiError(res, error, "STORE-PURCHASE-ORDERS")
  }
}

