import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { z } from "zod";
import { handleApiError } from "../../../../../lib/api-error-handler";

const updateBillingSchema = z
  .object({
    plan: z.string().optional(),
    billing_email: z.string().optional(),
    billing_cycle: z.string().optional(),
    payment_method: z.any().optional(),
  })
  .passthrough();

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const query = req.scope.resolve("query") as unknown as any;
  const { id } = req.params;

  // Get tenant
  const {
    data: [tenant],
  } = await query.graph({
    entity: "tenant",
    fields: ["*"],
    filters: { id },
  });

  if (!tenant) {
    return res.status(404).json({ message: "Tenant not found" });
  }

  // Get tenant billing info
  let billing = null;
  try {
    const {
      data: [billingData],
    } = await query.graph({
      entity: "tenant_billing",
      fields: ["*"],
      filters: { tenant_id: id },
    });
    billing = billingData;
  } catch {
    // Billing entity may not exist
  }

  // Calculate usage metrics (simplified - would come from actual metrics in production)
  const usage = {
    orders_this_month: 0,
    storage_used_mb: 0,
    api_calls_this_month: 0,
    active_users: 0,
    products_count: 0,
  };

  // Try to get actual counts
  try {
    const { data: orders } = await query.graph({
      entity: "order",
      fields: ["id"],
      filters: {
        // Would filter by tenant_id in multi-tenant setup
      },
    });
    usage.orders_this_month = orders.length;

    const { data: products } = await query.graph({
      entity: "product",
      fields: ["id"],
    });
    usage.products_count = products.length;
  } catch {
    // Ignore if entities don't exist
  }

  res.json({
    tenant,
    billing: billing || {
      plan: "free",
      billing_email: tenant.contact_email,
      billing_cycle: "monthly",
      next_billing_date: null,
      payment_method: null,
    },
    usage,
    limits: {
      max_orders_per_month:
        billing?.plan === "enterprise"
          ? -1
          : billing?.plan === "pro"
            ? 10000
            : 100,
      max_products:
        billing?.plan === "enterprise"
          ? -1
          : billing?.plan === "pro"
            ? 10000
            : 100,
      max_storage_mb:
        billing?.plan === "enterprise"
          ? -1
          : billing?.plan === "pro"
            ? 10000
            : 500,
      max_users:
        billing?.plan === "enterprise" ? -1 : billing?.plan === "pro" ? 50 : 5,
    },
  });
}

export async function PUT(req: MedusaRequest, res: MedusaResponse) {
  const tenantService = req.scope.resolve("tenantModuleService") as unknown as any;
  const { id } = req.params;
  const parsed = updateBillingSchema.safeParse(req.body);
  if (!parsed.success) {
    return res
      .status(400)
      .json({ message: "Validation failed", errors: parsed.error.issues });
  }
  const { plan, billing_email, billing_cycle, payment_method } = parsed.data;

  // Update tenant billing (would use proper tenant billing service)
  try {
    const updateData: Record<string, any> = {};
    if (plan) updateData.plan = plan;
    if (billing_email) updateData.billing_email = billing_email;
    if (billing_cycle) updateData.billing_cycle = billing_cycle;
    if (payment_method) updateData.payment_method = payment_method;

    // Update billing through tenant metadata for now
    await tenantService.updateTenants({
      id,
      metadata: {
        billing: updateData,
      },
    });

    res.json({ message: "Billing updated", billing: updateData });
  } catch (error: unknown) {
    handleApiError(res, error, "ADMIN-TENANTS-ID-BILLING");
  }
}
