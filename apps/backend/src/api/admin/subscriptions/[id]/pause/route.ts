import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { z } from "zod";
import { handleApiError } from "../../../../../lib/api-error-handler";

const pauseSubscriptionSchema = z
  .object({
    reason: z.string().optional(),
    resume_date: z.string().optional(),
  })
  .passthrough();

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const query = req.scope.resolve("query") as unknown as any;
    const subscriptionService = req.scope.resolve("subscription") as unknown as any;
    const { id } = req.params;
    const parsed = pauseSubscriptionSchema.safeParse(req.body);
    if (!parsed.success) {
      return res
        .status(400)
        .json({ message: "Validation failed", errors: parsed.error.issues });
    }
    const { reason, resume_date } = parsed.data;

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
        .json({ message: "Can only pause active subscriptions" });
    }

    const updated = await subscriptionService.updateSubscriptions({
      id,
      status: "paused",
      paused_at: new Date(),
      metadata: {
        ...subscription.metadata,
        pause_reason: reason || "Paused by admin",
        paused_by: "admin",
        scheduled_resume_date: resume_date,
      },
    });

    res.json({
      subscription: updated,
      message: "Subscription paused",
    });
  } catch (error: unknown) {
    handleApiError(res, error, "POST admin subscriptions id pause");
  }
}
