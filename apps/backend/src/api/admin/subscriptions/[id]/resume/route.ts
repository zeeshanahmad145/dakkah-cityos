import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { handleApiError } from "../../../../../lib/api-error-handler";

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const query = req.scope.resolve("query") as unknown as any;
    const subscriptionService = req.scope.resolve("subscriptionModuleService") as unknown as any;
    const { id } = req.params;

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

    if (subscription.status !== "paused") {
      return res
        .status(400)
        .json({ message: "Can only resume paused subscriptions" });
    }

    const updated = await subscriptionService.updateSubscriptions({
      id,
      status: "active",
      resumed_at: new Date(),
      metadata: {
        ...subscription.metadata,
        resumed_by: "admin",
        resumed_at: new Date().toISOString(),
      },
    });

    res.json({
      subscription: updated,
      message: "Subscription resumed",
    });
  } catch (error: unknown) {
    handleApiError(res, error, "POST admin subscriptions id resume");
  }
}
