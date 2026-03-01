// @ts-nocheck
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { z } from "zod";
import { handleApiError } from "../../../../../lib/api-error-handler";

const changePlanSchema = z
  .object({
    new_plan_id: z.string(),
    prorate: z.boolean().optional(),
  })
  .passthrough();

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const query = req.scope.resolve("query") as unknown as any;
    const subscriptionService = req.scope.resolve("subscription") as unknown as any;
    const { id } = req.params;
    const parsed = changePlanSchema.safeParse(req.body);
    if (!parsed.success) {
      return res
        .status(400)
        .json({ message: "Validation failed", errors: parsed.error.issues });
    }
    const { new_plan_id, prorate } = parsed.data;

    // Get current subscription
    const {
      data: [subscription],
    } = await query.graph({
      entity: "subscription",
      fields: ["*"],
      filters: { id },
    });

    if (!subscription) {
      return res.status(404).json({ message: "Subscription not found" });
    }

    if (subscription.status !== "active") {
      return res
        .status(400)
        .json({ message: "Can only change plan for active subscriptions" });
    }

    // Get new plan details
    const {
      data: [newPlan],
    } = await query.graph({
      entity: "subscription_plan",
      fields: ["*"],
      filters: { id: new_plan_id },
    });

    if (!newPlan) {
      return res.status(404).json({ message: "New plan not found" });
    }

    // Calculate proration if needed
    let prorationAmount = 0;
    if (prorate) {
      const currentPeriodEnd = new Date(subscription.current_period_end);
      const now = new Date();
      const daysRemaining = Math.ceil(
        (currentPeriodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
      );
      const totalDays = subscription.billing_interval === "yearly" ? 365 : 30;

      const oldDailyRate = parseFloat(subscription.amount) / totalDays;
      const newDailyRate = parseFloat(newPlan.price) / totalDays;

      prorationAmount = (newDailyRate - oldDailyRate) * daysRemaining;
    }

    // Update subscription
    const updated = await subscriptionService.updateSubscriptions({
      id,
      plan_id: new_plan_id,
      amount: newPlan.price,
      metadata: {
        ...subscription.metadata,
        previous_plan_id: subscription.plan_id,
        plan_changed_at: new Date().toISOString(),
        plan_changed_by: "admin",
        proration_amount: prorationAmount,
      },
    });

    res.json({
      subscription: updated,
      proration_amount: prorationAmount,
      message: `Plan changed to ${newPlan.name}`,
    });
  } catch (error: unknown) {
    handleApiError(res, error, "POST admin subscriptions id change-plan");
  }
}
