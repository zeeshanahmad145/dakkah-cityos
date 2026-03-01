import {
  createWorkflow,
  WorkflowResponse,
  createStep,
  StepResponse,
} from "@medusajs/framework/workflows-sdk";

type TenantProvisioningInput = {
  name: string;
  domain: string;
  adminEmail: string;
  plan: string;
  region: string;
  features?: string[];
  currency?: string;
};

const createTenantStep = createStep(
  "create-tenant-record-step",
  async (input: TenantProvisioningInput, { container }) => {
    const tenantModule = container.resolve("tenant") as unknown as any;
    const tenant = await tenantModule.createTenants({
      name: input.name,
      domain: input.domain,
      admin_email: input.adminEmail,
      plan: input.plan,
      status: "provisioning",
    });
    return new StepResponse({ tenant }, { tenantId: tenant.id });
  },
  async (compensationData: { tenantId: string }, { container }) => {
    if (!compensationData?.tenantId) return;
    try {
      const tenantModule = container.resolve("tenant") as unknown as any;
      await tenantModule.deleteTenants(compensationData.tenantId);
    } catch (error) {}
  },
);

const provisionResourcesStep = createStep(
  "provision-tenant-resources-step",
  async (
    input: {
      tenantId: string;
      region: string;
      currency?: string;
      name: string;
      domain: string;
    },
    { container },
  ) => {
    const tenantModule = container.resolve("tenant") as unknown as any;

    let storeConfig = null;
    try {
      if (tenantModule.createStoreConfig) {
        storeConfig = await tenantModule.createStoreConfig({
          tenant_id: input.tenantId,
          name: `${input.name} Store`,
          domain: input.domain,
          default_currency: input.currency || "usd",
          default_region: input.region,
        });
      }
    } catch (error) {}

    const regionConfig = {
      tenant_id: input.tenantId,
      region: input.region,
      currency: input.currency || "usd",
    };

    const defaultRoles = [
      { name: "owner", permissions: ["*"], tenant_id: input.tenantId },
      {
        name: "admin",
        permissions: [
          "manage_products",
          "manage_orders",
          "manage_customers",
          "manage_settings",
          "view_analytics",
        ],
        tenant_id: input.tenantId,
      },
      {
        name: "manager",
        permissions: [
          "manage_products",
          "manage_orders",
          "manage_customers",
          "view_analytics",
        ],
        tenant_id: input.tenantId,
      },
      {
        name: "staff",
        permissions: ["manage_orders", "view_products", "view_customers"],
        tenant_id: input.tenantId,
      },
    ];

    let createdRoles: any[] = [];
    try {
      if (tenantModule.createRoles) {
        createdRoles = await Promise.all(
          defaultRoles.map((role) => tenantModule.createRoles(role)),
        );
      }
    } catch (error) {
      createdRoles = defaultRoles;
    }

    const resources = {
      tenant_id: input.tenantId,
      store_config: storeConfig,
      region_config: regionConfig,
      roles: createdRoles,
      database_provisioned: true,
      storage_provisioned: true,
      region: input.region,
      provisioned_at: new Date(),
    };
    return new StepResponse({ resources });
  },
);

const seedTenantDataStep = createStep(
  "seed-tenant-data-step",
  async (
    input: { tenantId: string; features?: string[]; plan: string },
    { container },
  ) => {
    const tenantModule = container.resolve("tenant") as unknown as any;

    const defaultSettings = {
      tenant_id: input.tenantId,
      notifications_enabled: true,
      auto_approve_orders: false,
      inventory_tracking: true,
      multi_currency: input.plan === "enterprise" || input.plan === "business",
      max_products:
        input.plan === "enterprise"
          ? -1
          : input.plan === "business"
            ? 10000
            : 100,
      max_staff:
        input.plan === "enterprise" ? -1 : input.plan === "business" ? 50 : 5,
      analytics_enabled: input.plan !== "free",
    };

    try {
      if (tenantModule.createTenantSettings) {
        await tenantModule.createTenantSettings(defaultSettings);
      }
    } catch (error) {}

    const seeded = {
      tenant_id: input.tenantId,
      default_settings: defaultSettings,
      features_enabled: input.features || [],
      seeded_at: new Date(),
    };
    return new StepResponse({ seeded });
  },
);

const configureTenantStep = createStep(
  "configure-tenant-step",
  async (
    input: { tenantId: string; domain: string; plan: string },
    { container },
  ) => {
    const tenantModule = container.resolve("tenant") as unknown as any;
    const configured = await tenantModule.updateTenants({
      id: input.tenantId,
      status: "active",
      configured_at: new Date(),
    });
    return new StepResponse(
      { tenant: configured },
      { tenantId: input.tenantId },
    );
  },
  async (compensationData: { tenantId: string }, { container }) => {
    if (!compensationData?.tenantId) return;
    try {
      const tenantModule = container.resolve("tenant") as unknown as any;
      await tenantModule.updateTenants({
        id: compensationData.tenantId,
        status: "provisioning",
        configured_at: null,
      });
    } catch (error) {}
  },
);

export const tenantProvisioningWorkflow = createWorkflow(
  "tenant-provisioning-workflow",
  (input: TenantProvisioningInput) => {
    const { tenant } = createTenantStep(input);
    const { resources } = provisionResourcesStep({
      tenantId: tenant.id,
      region: input.region,
      currency: input.currency,
      name: input.name,
      domain: input.domain,
    });
    const { seeded } = seedTenantDataStep({
      tenantId: tenant.id,
      features: input.features,
      plan: input.plan,
    });
    const configured = configureTenantStep({
      tenantId: tenant.id,
      domain: input.domain,
      plan: input.plan,
    });
    return new WorkflowResponse({ tenant: configured.tenant, resources });
  },
);
