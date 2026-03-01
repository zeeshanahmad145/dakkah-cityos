import { MedusaService } from "@medusajs/framework/utils";
import Tenant from "./models/tenant";
import {
  TenantBilling,
  TenantUsageRecord,
  TenantInvoice,
} from "./models/tenant-billing";
import { TenantSettings } from "./models/tenant-settings";
import { TenantUser } from "./models/tenant-user";
import TenantRelationship from "./models/tenant-relationship";
import TenantPOI from "./models/tenant-poi";
import ServiceChannel from "./models/service-channel";

const ROLE_LEVEL_MAP: Record<string, number> = {
  "super-admin": 100,
  "tenant-admin": 90,
  "compliance-officer": 85,
  auditor: 80,
  "city-manager": 70,
  "district-manager": 60,
  "zone-operator": 50,
  "facility-operator": 40,
  "asset-technician": 30,
  viewer: 10,
};

class TenantModuleService extends MedusaService({
  Tenant,
  TenantBilling,
  TenantUsageRecord,
  TenantInvoice,
  TenantSettings,
  TenantUser,
  TenantRelationship,
  TenantPOI,
  ServiceChannel,
}) {
  // ============ Tenant Lookup ============

  async retrieveTenantBySlug(slug: string) {
    const tenants = (await this.listTenants({ slug })) as any;
    const list = Array.isArray(tenants) ? tenants : [tenants].filter(Boolean);
    const filtered = list.filter(
      (t: any) => t.status === "active" || t.status === "trial",
    );
    return filtered[0] || null;
  }

  async retrieveTenantByDomain(domain: string) {
    const tenants = (await this.listTenants({ domain })) as any;
    const list = Array.isArray(tenants) ? tenants : [tenants].filter(Boolean);
    const filtered = list.filter(
      (t: any) => t.status === "active" || t.status === "trial",
    );
    return filtered[0] || null;
  }

  async retrieveTenantByHandle(handle: string) {
    const tenants = (await this.listTenants({ handle })) as any;
    const list = Array.isArray(tenants) ? tenants : [tenants].filter(Boolean);
    return list[0] || null;
  }

  async resolveTenant(query: {
    slug?: string;
    domain?: string;
    handle?: string;
  }) {
    if (query.slug) {
      const tenant = (await this.retrieveTenantBySlug(query.slug)) as any;
      if (tenant) return tenant;
    }

    if (query.domain) {
      const tenant = (await this.retrieveTenantByDomain(query.domain)) as any;
      if (tenant) return tenant;
    }

    if (query.handle) {
      const tenant = (await this.retrieveTenantByHandle(query.handle)) as any;
      if (tenant) return tenant;
    }

    return null;
  }

  async getTenantWithGovernance(tenantId: string) {
    const tenant = (await this.retrieveTenant(tenantId)) as any;
    if (!tenant) return null;

    return {
      ...tenant,
      governance: {
        country_id: tenant.country_id,
        governance_authority_id: tenant.governance_authority_id,
        residency_zone: tenant.residency_zone,
      },
    };
  }

  async listTenantsByHierarchy(filters: {
    country_id?: string;
    residency_zone?: string;
    governance_authority_id?: string;
  }) {
    return (await this.listTenants(filters)) as any;
  }

  async activateTenant(tenant_id: string) {
    return await this.updateTenants({
      id: tenant_id,
      status: "active",
      trial_ends_at: null,
    } as any);
  }

  async suspendTenant(tenant_id: string, reason?: string) {
    return await this.updateTenants({
      id: tenant_id,
      status: "suspended",
      metadata: { suspension_reason: reason },
    });
  }

  // ============ Tenant Onboarding ============

  async createTenantWithSetup(data: {
    name: string;
    handle: string;
    slug: string;
    email: string;
    ownerId: string;
    domain?: string;
    residency_zone?: string;
    country_id?: string;
    governance_authority_id?: string;
    default_locale?: string;
    supported_locales?: string[];
    timezone?: string;
    default_currency?: string;
    date_format?: string;
    default_persona_id?: string;
    logo_url?: string;
    favicon_url?: string;
    primary_color?: string;
    accent_color?: string;
    font_family?: string;
    branding?: Record<string, any>;
    subscriptionTier?: string;
    trialDays?: number;
  }): Promise<any> {
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + (data.trialDays || 14));

    const tenant = await this.createTenants({
      name: data.name,
      handle: data.handle,
      slug: data.slug,
      domain: data.domain || null,
      billing_email: data.email,
      subscription_tier: data.subscriptionTier || "basic",
      status: "trial",
      trial_starts_at: new Date(),
      trial_ends_at: trialEndsAt,
      residency_zone: data.residency_zone || "GLOBAL",
      country_id: data.country_id || null,
      governance_authority_id: data.governance_authority_id || null,
      default_locale: data.default_locale || "en",
      supported_locales: data.supported_locales || ["en"],
      timezone: data.timezone || "UTC",
      default_currency: data.default_currency || "usd",
      date_format: data.date_format || "dd/MM/yyyy",
      default_persona_id: data.default_persona_id || null,
      logo_url: data.logo_url || null,
      favicon_url: data.favicon_url || null,
      primary_color: data.primary_color || null,
      accent_color: data.accent_color || null,
      font_family: data.font_family || null,
      branding: data.branding || null,
    } as any);

    await this.createTenantSettings({
      tenant_id: tenant.id,
      default_locale: data.default_locale || "en",
      supported_locales: data.supported_locales || ["en"],
      timezone: data.timezone || "UTC",
      default_currency: data.default_currency || "usd",
    } as any);

    await this.createTenantBillings({
      tenant_id: tenant.id,
      subscription_status: "trialing",
      current_period_start: new Date(),
      current_period_end: trialEndsAt,
    } as any);

    await this.createTenantUsers({
      tenant_id: tenant.id,
      user_id: data.ownerId,
      role: "tenant-admin",
      role_level: ROLE_LEVEL_MAP["tenant-admin"],
      status: "active",
    } as any);

    return tenant;
  }

  // ============ Billing Management ============

  async getTenantBilling(tenantId: string): Promise<any> {
    const billings = (await this.listTenantBillings({
      tenant_id: tenantId,
    })) as any;
    const list = Array.isArray(billings)
      ? billings
      : [billings].filter(Boolean);
    return list[0] || null;
  }

  async updateSubscription(
    tenantId: string,
    planId: string,
    planName: string,
    planType: "monthly" | "yearly",
    basePrice: number,
  ): Promise<any> {
    const billing = await this.getTenantBilling(tenantId);
    if (!billing) throw new Error("Billing not found");

    const periodEnd = new Date();
    if (planType === "monthly") {
      periodEnd.setMonth(periodEnd.getMonth() + 1);
    } else {
      periodEnd.setFullYear(periodEnd.getFullYear() + 1);
    }

    return await this.updateTenantBillings({
      id: billing.id,
      plan_id: planId,
      plan_name: planName,
      plan_type: planType,
      base_price: basePrice,
      subscription_status: "active",
      current_period_start: new Date(),
      current_period_end: periodEnd,
    } as any);
  }

  async recordUsage(
    tenantId: string,
    usageType: string,
    quantity: number,
    referenceType?: string,
    referenceId?: string,
  ): Promise<any> {
    const billing = await this.getTenantBilling(tenantId);
    if (!billing) throw new Error("Billing not found");

    const unitPrice = billing.usage_price_per_unit || 0;
    const totalCost = quantity * Number(unitPrice);

    const record = await this.createTenantUsageRecords({
      tenant_id: tenantId,
      billing_id: billing.id,
      usage_type: usageType,
      quantity,
      unit_price: unitPrice,
      total_cost: totalCost,
      recorded_at: new Date(),
      period_start: billing.current_period_start,
      period_end: billing.current_period_end,
      reference_type: referenceType,
      reference_id: referenceId,
    } as any);

    await this.updateTenantBillings({
      id: billing.id,
      current_usage: (billing.current_usage || 0) + quantity,
      current_usage_cost: Number(billing.current_usage_cost || 0) + totalCost,
    } as any);

    return record;
  }

  async getUsageSummary(
    tenantId: string,
    periodStart: Date,
    periodEnd: Date,
  ): Promise<any> {
    const records = (await this.listTenantUsageRecords({
      tenant_id: tenantId,
    })) as any;

    const list = (
      Array.isArray(records) ? records : [records].filter(Boolean)
    ).filter((r: any) => {
      const recordedAt = new Date(r.recorded_at);
      return recordedAt >= periodStart && recordedAt <= periodEnd;
    });

    const summary: Record<string, { quantity: number; cost: number }> = {};

    for (const record of list) {
      const type = record.usage_type;
      if (!summary[type]) {
        summary[type] = { quantity: 0, cost: 0 };
      }
      summary[type].quantity += record.quantity;
      summary[type].cost += Number(record.total_cost || 0);
    }

    return summary;
  }

  async generateInvoice(tenantId: string): Promise<any> {
    const billing = await this.getTenantBilling(tenantId);
    if (!billing) throw new Error("Billing not found");

    const tenant = (await this.retrieveTenant(tenantId)) as any;

    const usageSummary = await this.getUsageSummary(
      tenantId,
      billing.current_period_start,
      billing.current_period_end,
    );

    const usageAmount = Object.values(usageSummary).reduce(
      (sum: number, u: any) => sum + (u.cost || 0),
      0,
    ) as number;

    const totalAmount = Number(billing.base_price || 0) + usageAmount;

    const invoiceNumber = `INV-${tenant.handle?.toUpperCase() || "T"}-${Date.now().toString(36).toUpperCase()}`;

    const lineItems = [
      {
        description: `${billing.plan_name || "Subscription"} (${billing.plan_type})`,
        quantity: 1,
        unit_price: billing.base_price,
        total: billing.base_price,
      },
      ...Object.entries(usageSummary).map(([type, data]: [string, any]) => ({
        description: `${type} usage`,
        quantity: data.quantity,
        unit_price: billing.usage_price_per_unit,
        total: data.cost,
      })),
    ];

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 30);

    return await this.createTenantInvoices({
      tenant_id: tenantId,
      billing_id: billing.id,
      invoice_number: invoiceNumber,
      period_start: billing.current_period_start,
      period_end: billing.current_period_end,
      currency_code: billing.currency_code,
      base_amount: billing.base_price,
      usage_amount: usageAmount,
      total_amount: totalAmount,
      status: "open",
      due_date: dueDate,
      line_items: lineItems,
    } as any);
  }

  // ============ Team Management ============

  async inviteUser(
    tenantId: string,
    email: string,
    role: string,
    invitedById: string,
  ): Promise<any> {
    const invitationToken =
      Math.random().toString(36).substring(2) + Date.now().toString(36);
    const roleLevel = ROLE_LEVEL_MAP[role] || 10;

    return await this.createTenantUsers({
      tenant_id: tenantId,
      user_id: `pending_${email}`,
      role,
      role_level: roleLevel,
      status: "invited",
      invitation_token: invitationToken,
      invitation_sent_at: new Date(),
      invited_by_id: invitedById,
    } as any);
  }

  async acceptInvitation(
    invitationToken: string,
    userId: string,
  ): Promise<any> {
    const users = (await this.listTenantUsers({
      invitation_token: invitationToken,
    })) as any;
    const list = Array.isArray(users) ? users : [users].filter(Boolean);

    if (list.length === 0) {
      throw new Error("Invalid invitation token");
    }

    const tenantUser = list[0];

    return await this.updateTenantUsers({
      id: tenantUser.id,
      user_id: userId,
      status: "active",
      invitation_accepted_at: new Date(),
      invitation_token: null,
    } as any);
  }

  async getTenantTeam(tenantId: string): Promise<any[]> {
    const users = (await this.listTenantUsers({ tenant_id: tenantId })) as any;
    return Array.isArray(users) ? users : [users].filter(Boolean);
  }

  async hasPermission(
    tenantId: string,
    userId: string,
    resource: string,
    action: string,
  ): Promise<boolean> {
    const users = (await this.listTenantUsers({
      tenant_id: tenantId,
      user_id: userId,
      status: "active",
    })) as any;

    const list = Array.isArray(users) ? users : [users].filter(Boolean);
    if (list.length === 0) return false;

    const tenantUser = list[0];

    if (tenantUser.role === "super-admin") return true;

    if (tenantUser.role === "tenant-admin" && action !== "transfer_ownership")
      return true;

    const permissions = tenantUser.permissions || {};
    const resourcePermissions = permissions[resource] || [];

    return (
      resourcePermissions.includes(action) || resourcePermissions.includes("*")
    );
  }

  async hasNodeScopedAccess(
    tenantId: string,
    userId: string,
    nodeId: string,
    requiredRoleLevel: number,
  ): Promise<boolean> {
    const users = (await this.listTenantUsers({
      tenant_id: tenantId,
      user_id: userId,
      status: "active",
    })) as any;

    const list = Array.isArray(users) ? users : [users].filter(Boolean);
    if (list.length === 0) return false;

    const tenantUser = list[0];

    if (tenantUser.role_level < requiredRoleLevel) return false;

    if (tenantUser.role === "super-admin" || tenantUser.role === "tenant-admin")
      return true;

    const assignedNodeIds: string[] = tenantUser.assigned_node_ids || [];
    if (assignedNodeIds.length === 0) return true;

    return assignedNodeIds.includes(nodeId);
  }

  // ============ Settings Management ============

  async getTenantSettings(tenantId: string): Promise<any> {
    const settings = (await this.listTenantSettings({
      tenant_id: tenantId,
    })) as any;
    const list = Array.isArray(settings)
      ? settings
      : [settings].filter(Boolean);
    return list[0] || null;
  }

  async upsertTenantSettings(tenantId: string, updates: any): Promise<any> {
    const settings = await this.getTenantSettings(tenantId);

    if (!settings) {
      return await this.createTenantSettings({
        tenant_id: tenantId,
        ...updates,
      } as any);
    }

    return await this.updateTenantSettings({
      id: settings.id,
      ...updates,
    } as any);
  }

  // ============ Limits & Quotas ============

  async checkTenantLimits(tenantId: string): Promise<{
    withinLimits: boolean;
    violations: string[];
  }> {
    const billing = await this.getTenantBilling(tenantId);
    if (!billing) return { withinLimits: true, violations: [] };

    const violations: string[] = [];

    if (
      billing.max_orders_per_month &&
      billing.current_usage > billing.max_orders_per_month
    ) {
      violations.push("max_orders_per_month");
    }

    if (billing.max_team_members) {
      const team = await this.getTenantTeam(tenantId);
      if (team.length > billing.max_team_members) {
        violations.push("max_team_members");
      }
    }

    return {
      withinLimits: violations.length === 0,
      violations,
    };
  }
}

export default TenantModuleService;
