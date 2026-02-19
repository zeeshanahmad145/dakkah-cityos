import {
  createWorkflow,
  WorkflowResponse,
  createStep,
  StepResponse,
} from "@medusajs/framework/workflows-sdk"

type LoyaltyRewardInput = {
  customerId: string
  orderId: string
  orderTotal: number
  tenantId: string
  pointsMultiplier?: number
}

const calculatePointsStep = createStep(
  "calculate-loyalty-points-step",
  async (input: LoyaltyRewardInput) => {
    const multiplier = input.pointsMultiplier || 1
    const points = Math.floor(input.orderTotal * multiplier)
    return new StepResponse({ points, customerId: input.customerId })
  }
)

const creditPointsStep = createStep(
  "credit-loyalty-points-step",
  async (input: { customerId: string; points: number; orderId: string }, { container }) => {
    const loyaltyModule = container.resolve("loyalty") as any
    const transaction = await loyaltyModule.createLoyaltyTransactions({
      customer_id: input.customerId,
      points: input.points,
      type: "earn",
      source: "order",
      reference_id: input.orderId,
    })
    return new StepResponse({ transaction }, { transactionId: transaction.id })
  },
  async (compensationData: { transactionId: string } | undefined, { container }) => {
    if (!compensationData?.transactionId) return
    try {
      const loyaltyModule = container.resolve("loyalty") as any
      await loyaltyModule.deleteLoyaltyTransactions(compensationData.transactionId)
    } catch (error) {
    }
  }
)

const notifyRewardStep = createStep(
  "notify-loyalty-reward-step",
  async (input: { customerId: string; points: number }) => {
    return new StepResponse({ notified: true, customerId: input.customerId, points: input.points })
  }
)

export const loyaltyRewardWorkflow = createWorkflow(
  "loyalty-reward-workflow",
  (input: LoyaltyRewardInput) => {
    const { points } = calculatePointsStep(input)
    const { transaction } = creditPointsStep({ customerId: input.customerId, points, orderId: input.orderId })
    const notification = notifyRewardStep({ customerId: input.customerId, points })
    return new WorkflowResponse({ transaction, notification })
  }
)
