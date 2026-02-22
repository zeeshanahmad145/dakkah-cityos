import {
  createWorkflow,
  WorkflowResponse,
  createStep,
  StepResponse,
} from "@medusajs/framework/workflows-sdk"

type DisputeResolutionInput = {
  orderId: string
  customerId: string
  vendorId: string
  reason: string
  description: string
  evidenceUrls?: string[]
}

const openDisputeStep = createStep(
  "open-dispute-step",
  async (input: DisputeResolutionInput, { container }) => {
    const disputeModule = container.resolve("dispute") as any
    const dispute = await disputeModule.createDisputes({
      order_id: input.orderId,
      customer_id: input.customerId,
      vendor_id: input.vendorId,
      reason: input.reason,
      description: input.description,
      status: "open",
    })
    return new StepResponse({ dispute }, { disputeId: dispute.id })
  },
  async (compensationData: { disputeId: string } | undefined, { container }) => {
    if (!compensationData?.disputeId) return
    try {
      const disputeModule = container.resolve("dispute") as any
      await disputeModule.deleteDisputes(compensationData.disputeId)
    } catch (error) {
    }
  }
)

const reviewDisputeStep = createStep(
  "review-dispute-step",
  async (input: { disputeId: string }, { container }) => {
    const disputeModule = container.resolve("dispute") as any
    const updated = await disputeModule.updateDisputes({
      id: input.disputeId,
      status: "under_review",
      reviewed_at: new Date(),
    })
    return new StepResponse({ dispute: updated }, { disputeId: input.disputeId, previousStatus: "open" })
  },
  async (compensationData: { disputeId: string; previousStatus: string } | undefined, { container }) => {
    if (!compensationData?.disputeId) return
    try {
      const disputeModule = container.resolve("dispute") as any
      await disputeModule.updateDisputes({
        id: compensationData.disputeId,
        status: compensationData.previousStatus,
      })
    } catch (error) {
    }
  }
)

const resolveDisputeStep = createStep(
  "resolve-dispute-step",
  async (input: { disputeId: string; resolution: string }, { container }) => {
    const disputeModule = container.resolve("dispute") as any
    const resolved = await disputeModule.updateDisputes({
      id: input.disputeId,
      status: "resolved",
      resolution: input.resolution,
      resolved_at: new Date(),
    })
    return new StepResponse({ dispute: resolved }, { disputeId: input.disputeId, previousStatus: "under_review" })
  },
  async (compensationData: { disputeId: string; previousStatus: string } | undefined, { container }) => {
    if (!compensationData?.disputeId) return
    try {
      const disputeModule = container.resolve("dispute") as any
      await disputeModule.updateDisputes({
        id: compensationData.disputeId,
        status: compensationData.previousStatus,
        resolution: null,
      })
    } catch (error) {
    }
  }
)

export const disputeResolutionWorkflow = createWorkflow(
  "dispute-resolution-workflow",
  (input: DisputeResolutionInput) => {
    const { dispute } = openDisputeStep(input)
    const reviewed = reviewDisputeStep({ disputeId: dispute.id })
    const resolved = resolveDisputeStep({ disputeId: dispute.id, resolution: "pending_mediation" })
    return new WorkflowResponse({ dispute: resolved.dispute })
  }
)
