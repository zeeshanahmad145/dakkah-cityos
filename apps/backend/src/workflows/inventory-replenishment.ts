import {
  createWorkflow,
  WorkflowResponse,
  createStep,
  StepResponse,
} from "@medusajs/framework/workflows-sdk"

type InventoryReplenishmentInput = {
  productId: string
  variantId: string
  locationId: string
  currentStock: number
  reorderPoint: number
  reorderQuantity: number
  supplierId?: string
}

const checkStockAlertStep = createStep(
  "check-stock-alert-step",
  async (input: InventoryReplenishmentInput) => {
    const needsReorder = input.currentStock <= input.reorderPoint
    if (!needsReorder) throw new Error("Stock level is above reorder point")
    return new StepResponse({ needsReorder, deficit: input.reorderPoint - input.currentStock })
  }
)

const calculateOrderQuantityStep = createStep(
  "calculate-reorder-quantity-step",
  async (input: InventoryReplenishmentInput) => {
    const quantity = Math.max(input.reorderQuantity, input.reorderPoint - input.currentStock)
    return new StepResponse({ quantity, variantId: input.variantId })
  }
)

const createPurchaseOrderStep = createStep(
  "create-purchase-order-step",
  async (input: { variantId: string; quantity: number; supplierId?: string; locationId: string }, { container }) => {
    const purchaseOrder = {
      variant_id: input.variantId,
      quantity: input.quantity,
      supplier_id: input.supplierId,
      location_id: input.locationId,
      status: "pending",
      created_at: new Date(),
    }
    return new StepResponse({ purchaseOrder }, { purchaseOrder })
  },
  async (compensationData: { purchaseOrder: any } | undefined, { container }) => {
    if (!compensationData?.purchaseOrder) return
    try {
      const orderModule = container.resolve("order") as any
      if (compensationData.purchaseOrder.id) {
        await orderModule.cancelOrder(compensationData.purchaseOrder.id)
      }
    } catch (error) {
    }
  }
)

export const inventoryReplenishmentWorkflow = createWorkflow(
  "inventory-replenishment-workflow",
  (input: InventoryReplenishmentInput) => {
    const alert = checkStockAlertStep(input)
    const { quantity } = calculateOrderQuantityStep(input)
    const { purchaseOrder } = createPurchaseOrderStep({
      variantId: input.variantId,
      quantity,
      supplierId: input.supplierId,
      locationId: input.locationId,
    })
    return new WorkflowResponse({ purchaseOrder, quantity })
  }
)
