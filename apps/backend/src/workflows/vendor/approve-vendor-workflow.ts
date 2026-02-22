import {
  createWorkflow,
  WorkflowResponse,
  createStep,
  StepResponse,
} from "@medusajs/framework/workflows-sdk"

// Step: Approve vendor
const approveVendorStep = createStep(
  "approve-vendor-step",
  async (
    input: {
      vendorId: string
      approvedBy: string
      notes?: string
    },
    { container }
  ) => {
    const vendorModule = container.resolve("vendor") as any

    const [vendor] = await vendorModule.updateVendors({
      id: input.vendorId,
      verification_status: "approved",
      status: "active",
      verified_at: new Date(),
      verified_by: input.approvedBy,
      verification_notes: input.notes,
      onboarded_at: new Date(),
    })

    return new StepResponse({ vendor }, { vendorId: input.vendorId, previousStatus: "pending", previousVerificationStatus: "onboarding" })
  },
  async (compensationData: { vendorId: string; previousStatus: string; previousVerificationStatus: string }, { container }) => {
    if (!compensationData?.vendorId) return
    try {
      const vendorModule = container.resolve("vendor") as any
      await vendorModule.updateVendors({
        id: compensationData.vendorId,
        verification_status: "pending",
        status: "onboarding",
        verified_at: null,
        verified_by: null,
        onboarded_at: null,
      })
    } catch (error) {
    }
  }
)

// Workflow
export const approveVendorWorkflow = createWorkflow(
  "approve-vendor-workflow",
  (
    input: {
      vendorId: string
      approvedBy: string
      notes?: string
    }
  ) => {
    const { vendor } = approveVendorStep(input)

    return new WorkflowResponse({ vendor })
  }
)
