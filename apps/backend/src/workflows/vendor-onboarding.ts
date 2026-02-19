import {
  createWorkflow,
  WorkflowResponse,
  createStep,
  StepResponse,
} from "@medusajs/framework/workflows-sdk"

type VendorOnboardingInput = {
  businessName: string
  email: string
  contactPerson: string
  taxId: string
  category: string
  tenantId: string
}

const submitApplicationStep = createStep(
  "submit-vendor-application-step",
  async (input: VendorOnboardingInput, { container }) => {
    const vendorModule = container.resolve("vendor") as any
    const vendor = await vendorModule.createVendors({
      name: input.businessName,
      email: input.email,
      contact_person: input.contactPerson,
      tax_id: input.taxId,
      status: "onboarding",
      verification_status: "pending",
    })
    return new StepResponse({ vendor }, { vendorId: vendor.id })
  },
  async (compensationData: { vendorId: string }, { container }) => {
    if (!compensationData?.vendorId) return
    try {
      const vendorModule = container.resolve("vendor") as any
      await vendorModule.deleteVendors(compensationData.vendorId)
    } catch (error) {
    }
  }
)

const verifyDocumentsStep = createStep(
  "verify-vendor-documents-step",
  async (input: { vendorId: string }, { container }) => {
    const vendorModule = container.resolve("vendor") as any
    const verified = await vendorModule.updateVendors({
      id: input.vendorId,
      verification_status: "documents_verified",
    })
    return new StepResponse({ verified: true }, { vendorId: input.vendorId })
  },
  async (compensationData: { vendorId: string }, { container }) => {
    if (!compensationData?.vendorId) return
    try {
      const vendorModule = container.resolve("vendor") as any
      await vendorModule.updateVendors({
        id: compensationData.vendorId,
        verification_status: "pending",
      })
    } catch (error) {
    }
  }
)

const setupVendorStoreStep = createStep(
  "setup-vendor-store-step",
  async (input: { vendorId: string; tenantId: string }, { container }) => {
    const storeModule = container.resolve("store") as any
    const store = await storeModule.createStores({
      vendor_id: input.vendorId,
      tenant_id: input.tenantId,
    })
    return new StepResponse({ store }, { storeId: store.id })
  },
  async (compensationData: { storeId: string }, { container }) => {
    if (!compensationData?.storeId) return
    try {
      const storeModule = container.resolve("store") as any
      await storeModule.deleteStores(compensationData.storeId)
    } catch (error) {
    }
  }
)

export const vendorOnboardingWorkflow = createWorkflow(
  "vendor-onboarding-workflow",
  (input: VendorOnboardingInput) => {
    const { vendor } = submitApplicationStep(input)
    const verification = verifyDocumentsStep({ vendorId: vendor.id })
    const { store } = setupVendorStoreStep({ vendorId: vendor.id, tenantId: input.tenantId })
    return new WorkflowResponse({ vendor, store })
  }
)
