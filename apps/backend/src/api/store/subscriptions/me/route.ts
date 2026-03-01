import { MedusaRequest, MedusaResponse } from "@medusajs/framework";
import { handleApiError } from "../../../../lib/api-error-handler";

// GET /store/subscriptions/me - List customer's subscriptions
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const subscriptionModule = req.scope.resolve("subscription") as unknown as any;
    const customerId = req.auth_context?.actor_id;

    if (!customerId) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const { offset = 0, limit = 20, status } = req.query;

    const filters: Record<string, unknown> = { customer_id: customerId };
    if (status) filters.status = status;

    const subscriptions = await subscriptionModule.listSubscriptions(filters, {
      skip: Number(offset),
      take: Number(limit),
      order: { created_at: "DESC" },
    });

    res.json({
      subscriptions,
      count: Array.isArray(subscriptions) ? subscriptions.length : 0,
      offset: Number(offset),
      limit: Number(limit),
    });
  } catch (error: unknown) {
    handleApiError(res, error, "GET store subscriptions me");
  }
}
