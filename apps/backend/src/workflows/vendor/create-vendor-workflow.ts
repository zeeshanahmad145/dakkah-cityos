import {
  createWorkflow,
  WorkflowResponse,
  transform,
  createStep,
  StepResponse,
} from "@medusajs/framework/workflows-sdk"

// Step: Create vendor
const createVendorStep = createStep(
  "create-vendor-step",
  async (
    input: {
      tenantId: string
      storeId?: string | null
      handle: string
      businessName: string
      legalName: string
      email: string
      phone?: string
      address: {
        line1: string
        line2?: string
        city: string
        state?: string
        postalCode: string
        countryCode: string
      }
      commissionRate?: number
      metadata?: Record<string, any>
    },
    { container }
  ) => {
    const vendorModule = container.resolve("vendor")

    const vendor = await vendorModule.createVendors({
      tenant_id: input.tenantId,
      store_id: input.storeId,
      handle: input.handle,
      business_name: input.businessName,
      legal_name: input.legalName,
      email: input.email,
      phone: input.phone,
      address_line1: input.address.line1,
      address_line2: input.address.line2,
      city: input.address.city,
      state: input.address.state,
      postal_code: input.address.postalCode,
      country_code: input.address.countryCode,
      commission_rate: input.commissionRate || 15,
      commission_type: "percentage",
      verification_status: "pending",
      status: "onboarding",
      metadata: input.metadata,
    })

    return new StepResponse({ vendor }, { vendor })
  },
  async (compensationData: { vendor: any }, { container }) => {
    if (!compensationData?.vendor?.id) return
    try {
      const vendorModule = container.resolve("vendor")
      await vendorModule.deleteVendors(compensationData.vendor.id)
    } catch (error) {
    }
  }
)

// Step: Create default commission rule
const createDefaultCommissionRuleStep = createStep(
  "create-default-commission-rule-step",
  async (
    input: {
      vendorId: string
      tenantId: string
      storeId?: string | null
      commissionRate: number
    },
    { container }
  ) => {
    const commissionModule = container.resolve("commission")

    const rule = await (commissionModule as any).createCommissions({
      tenant_id: input.tenantId,
      store_id: input.storeId,
      vendor_id: input.vendorId,
      name: `Default rule for vendor ${input.vendorId}`,
      commission_type: "percentage",
      commission_percentage: input.commissionRate,
      priority: 0,
      status: "active",
      applies_to: "all_products",
    })

    return new StepResponse({ rule }, { ruleId: rule.id })
  },
  async (compensationData: { ruleId: string }, { container }) => {
    if (!compensationData?.ruleId) return
    try {
      const commissionModule = container.resolve("commission")
      await (commissionModule as any).deleteCommissions(compensationData.ruleId)
    } catch (error) {
    }
  }
)

// Workflow
export const createVendorWorkflow = createWorkflow(
  "create-vendor-workflow",
  (
    input: {
      tenantId: string
      storeId?: string | null
      handle: string
      businessName: string
      legalName: string
      email: string
      phone?: string
      address: {
        line1: string
        line2?: string
        city: string
        state?: string
        postalCode: string
        countryCode: string
      }
      commissionRate?: number
      metadata?: Record<string, any>
    }
  ) => {
    const vendorResult = createVendorStep(input)

    const commissionRateTransformed = transform(
      { vendorResult, input },
      ({ vendorResult, input }) => ({
        vendorId: (vendorResult as any).vendor.id,
        tenantId: input.tenantId,
        storeId: input.storeId,
        commissionRate: input.commissionRate || 15,
      })
    )

    const { rule } = createDefaultCommissionRuleStep(commissionRateTransformed)

    return new WorkflowResponse({
      vendor: (vendorResult as any).vendor,
      commissionRule: rule,
    })
  }
)
