import { MedusaRequest, MedusaResponse } from "@medusajs/framework";
import { z } from "zod";
import { handleApiError } from "../../../../lib/api-error-handler"

/* eslint-disable @typescript-eslint/no-explicit-any */
const updateSubscriptionSchema = z.object({
  status: z.enum(["active", "paused", "canceled"]).optional(),
  payment_method_id: z.string().optional(),
  billing_interval: z.enum(["daily", "weekly", "monthly", "quarterly", "yearly"]).optional(),
  billing_interval_count: z.number().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
}).passthrough();

// GET /admin/subscriptions/:id - Get subscription
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const subscriptionModule = req.scope.resolve("subscription") as any;
    const tenantId = (req as any).tenant?.id;
    const { id } = req.params;
  
    if (!tenantId) {
      return res.status(403).json({ message: "Tenant context required" });
    }
  
    const [subscription] = await subscriptionModule.listSubscriptions({ id }, { take: 1 });
  
    if (!subscription || subscription.tenant_id !== tenantId) {
      return res.status(404).json({ message: "Subscription not found" });
    }
  
    res.json({ subscription });

  } catch (error: any) {
    handleApiError(res, error, "GET admin subscriptions id")}
}

// POST /admin/subscriptions/:id - Update subscription
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const subscriptionModule = req.scope.resolve("subscription") as any;
    const tenantId = (req as any).tenant?.id;
    const { id } = req.params;
  
    if (!tenantId) {
      return res.status(403).json({ message: "Tenant context required" });
    }
  
    const [subscription] = await subscriptionModule.listSubscriptions({ id }, { take: 1 });
  
    if (!subscription || subscription.tenant_id !== tenantId) {
      return res.status(404).json({ message: "Subscription not found" });
    }
  
    const parsed = updateSubscriptionSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: "Validation failed", errors: parsed.error.issues });
    }
    const validatedData = parsed.data;
  
    // Handle status changes
    const updateData: any = { ...validatedData };
    if (validatedData.status && validatedData.status !== subscription.status) {
      if (validatedData.status === "canceled") {
        updateData.canceled_at = new Date();
      }
    }
  
    const updated = await subscriptionModule.updateSubscriptions({ id, ...updateData });
  
    res.json({ subscription: updated });

  } catch (error: any) {
    handleApiError(res, error, "POST admin subscriptions id")}
}

// DELETE /admin/subscriptions/:id - Cancel subscription
export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  try {
    const subscriptionModule = req.scope.resolve("subscription") as any;
    const tenantId = (req as any).tenant?.id;
    const { id } = req.params;
  
    if (!tenantId) {
      return res.status(403).json({ message: "Tenant context required" });
    }
  
    const [subscription] = await subscriptionModule.listSubscriptions({ id }, { take: 1 });
  
    if (!subscription || subscription.tenant_id !== tenantId) {
      return res.status(404).json({ message: "Subscription not found" });
    }
  
    await subscriptionModule.updateSubscriptions({
      id,
      status: "canceled",
      canceled_at: new Date(),
    });
  
    res.json({ id, deleted: true });

  } catch (error: any) {
    handleApiError(res, error, "DELETE admin subscriptions id")}
}

