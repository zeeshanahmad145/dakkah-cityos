import {
  createWorkflow,
  WorkflowResponse,
  createStep,
  StepResponse,
} from "@medusajs/framework/workflows-sdk"

type CommissionCalcInput = {
  vendorId: string
  orderId: string
  orderTotal: number
  orderSubtotal: number
  tenantId: string
  lineItems: { id: string; amount: number }[]
}

const calculateCommissionStep = createStep(
  "calculate-vendor-commission-step",
  async (input: CommissionCalcInput, { container }) => {
    const commissionModule = container.resolve("commission") as any
    const rules = await commissionModule.listCommissionRules({ vendor_id: input.vendorId })
    const rate = rules?.[0]?.rate || 0.1
    const commissionAmount = Math.round(input.orderSubtotal * rate)
    const netAmount = input.orderSubtotal - commissionAmount
    return new StepResponse({ commissionAmount, rate, netAmount, vendorId: input.vendorId })
  }
)

const deductCommissionStep = createStep(
  "deduct-commission-step",
  async (input: { vendorId: string; commissionAmount: number; orderId: string }, { container }) => {
    const commissionModule = container.resolve("commission") as any
    const transaction = await commissionModule.createCommissionTransaction({
      vendorId: input.vendorId,
      orderId: input.orderId,
      amount: input.commissionAmount,
      type: "deduction",
    })
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

const recordPayoutStep = createStep(
  "record-commission-payout-step",
  async (input: { vendorId: string; netAmount: number; orderId: string }, { container }) => {
    const payoutModule = container.resolve("payout") as any
    const payout = await payoutModule.createPayouts({
      vendor_id: input.vendorId,
      amount: input.netAmount,
      status: "pending",
      reference_id: input.orderId,
    })
    return new StepResponse({ payout }, { payoutId: payout.id })
  },
  async (compensationData: { payoutId: string } | undefined, { container }) => {
    if (!compensationData?.payoutId) return
    try {
      const payoutModule = container.resolve("payout") as any
      await payoutModule.deletePayouts(compensationData.payoutId)
    } catch (error) {
    }
  }
)

export const commissionCalculationWorkflow = createWorkflow(
  "commission-calculation-workflow",
  (input: CommissionCalcInput) => {
    const { commissionAmount, rate, netAmount } = calculateCommissionStep(input)
    const { transaction } = deductCommissionStep({ vendorId: input.vendorId, commissionAmount, orderId: input.orderId })
    const { payout } = recordPayoutStep({ vendorId: input.vendorId, netAmount, orderId: input.orderId })
    return new WorkflowResponse({ commissionAmount, rate, transaction, payout })
  }
)
