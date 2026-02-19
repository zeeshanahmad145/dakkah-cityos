import {
  createWorkflow,
  WorkflowResponse,
  createStep,
  StepResponse,
} from "@medusajs/framework/workflows-sdk"

// Step: Calculate and create commission transaction
const calculateCommissionStep = createStep(
  "calculate-commission-step",
  async (
    input: {
      vendorId: string
      orderId: string
      lineItemId?: string
      orderSubtotal: number
      orderTotal: number
      tenantId: string
      storeId?: string | null
    },
    { container }
  ) => {
    const commissionModule = container.resolve("commission") as any

    const transaction = await commissionModule.createCommissionTransaction(input)

    return new StepResponse({ transaction }, { transaction })
  },
  async (compensationData: { transaction: any } | undefined, { container }) => {
    if (!compensationData?.transaction?.id) return
    try {
      const commissionModule = container.resolve("commission") as any
      await commissionModule.deleteCommissionTransactions(compensationData.transaction.id)
    } catch (error) {
    }
  }
)

// Workflow
export const calculateCommissionWorkflow = createWorkflow(
  "calculate-commission-workflow",
  (
    input: {
      vendorId: string
      orderId: string
      lineItemId?: string
      orderSubtotal: number
      orderTotal: number
      tenantId: string
      storeId?: string | null
    }
  ) => {
    const { transaction } = calculateCommissionStep(input)

    return new WorkflowResponse({ transaction })
  }
)
