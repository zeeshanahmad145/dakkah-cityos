import {
  createWorkflow,
  WorkflowResponse,
  createStep,
  StepResponse,
} from "@medusajs/framework/workflows-sdk"

type TenantProvisioningInput = {
  name: string
  domain: string
  adminEmail: string
  plan: string
  region: string
  features?: string[]
}

const createTenantStep = createStep(
  "create-tenant-record-step",
  async (input: TenantProvisioningInput, { container }) => {
    const tenantModule = container.resolve("tenant") as any
    const tenant = await tenantModule.createTenants({
      name: input.name,
      domain: input.domain,
      admin_email: input.adminEmail,
      plan: input.plan,
      status: "provisioning",
    })
    return new StepResponse({ tenant }, { tenantId: tenant.id })
  },
  async (compensationData: { tenantId: string }, { container }) => {
    if (!compensationData?.tenantId) return
    try {
      const tenantModule = container.resolve("tenant") as any
      await tenantModule.deleteTenants(compensationData.tenantId)
    } catch (error) {
    }
  }
)

const provisionResourcesStep = createStep(
  "provision-tenant-resources-step",
  async (input: { tenantId: string; region: string }) => {
    const resources = {
      tenant_id: input.tenantId,
      database_provisioned: true,
      storage_provisioned: true,
      region: input.region,
      provisioned_at: new Date(),
    }
    return new StepResponse({ resources })
  }
)

const seedTenantDataStep = createStep(
  "seed-tenant-data-step",
  async (input: { tenantId: string; features?: string[] }) => {
    const seeded = {
      tenant_id: input.tenantId,
      default_settings: true,
      features_enabled: input.features || [],
      seeded_at: new Date(),
    }
    return new StepResponse({ seeded })
  }
)

const configureTenantStep = createStep(
  "configure-tenant-step",
  async (input: { tenantId: string; domain: string; plan: string }, { container }) => {
    const tenantModule = container.resolve("tenant") as any
    const configured = await tenantModule.updateTenants({
      id: input.tenantId,
      status: "active",
      configured_at: new Date(),
    })
    return new StepResponse({ tenant: configured }, { tenantId: input.tenantId })
  },
  async (compensationData: { tenantId: string }, { container }) => {
    if (!compensationData?.tenantId) return
    try {
      const tenantModule = container.resolve("tenant") as any
      await tenantModule.updateTenants({
        id: compensationData.tenantId,
        status: "provisioning",
        configured_at: null,
      })
    } catch (error) {
    }
  }
)

export const tenantProvisioningWorkflow = createWorkflow(
  "tenant-provisioning-workflow",
  (input: TenantProvisioningInput) => {
    const { tenant } = createTenantStep(input)
    const { resources } = provisionResourcesStep({ tenantId: tenant.id, region: input.region })
    const { seeded } = seedTenantDataStep({ tenantId: tenant.id, features: input.features })
    const configured = configureTenantStep({ tenantId: tenant.id, domain: input.domain, plan: input.plan })
    return new WorkflowResponse({ tenant: configured.tenant, resources })
  }
)
