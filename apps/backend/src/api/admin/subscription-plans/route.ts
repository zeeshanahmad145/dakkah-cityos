import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { z } from "zod";
import { handleApiError } from "../../../lib/api-error-handler";

const createPlanSchema = z
  .object({
    name: z.string(),
    handle: z.string().optional(),
    description: z.string().optional(),
    billing_interval: z
      .enum(["daily", "weekly", "monthly", "quarterly", "yearly"])
      .optional(),
    billing_interval_count: z.number().optional(),
    price: z.string().optional(),
    currency_code: z.string().optional(),
    trial_days: z.number().optional(),
    setup_fee: z.string().optional(),
    is_active: z.boolean().optional(),
    sort_order: z.number().optional(),
    features: z.array(z.string()).optional(),
    metadata: z.record(z.string(), z.unknown()).optional(),
  })
  .passthrough();

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const query = req.scope.resolve("query") as unknown as any;

    const { data: plans } = await query.graph({
      entity: "subscription_plan",
      fields: [
        "id",
        "name",
        "handle",
        "description",
        "billing_interval",
        "billing_interval_count",
        "price",
        "currency_code",
        "trial_days",
        "setup_fee",
        "is_active",
        "sort_order",
        "features",
        "metadata",
        "created_at",
      ],
    });

    res.json({ plans });
  } catch (error: unknown) {
    handleApiError(res, error, "GET admin subscription-plans");
  }
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const subscriptionModuleService = req.scope.resolve(
      "subscriptionModuleService",
    ) as unknown as any;
    const parsed = createPlanSchema.safeParse(req.body);
    if (!parsed.success) {
      return res
        .status(400)
        .json({ message: "Validation failed", errors: parsed.error.issues });
    }

    const plan = await subscriptionModuleService.createSubscriptionPlans(
      parsed.data,
    );

    res.status(201).json({ plan });
  } catch (error: unknown) {
    handleApiError(res, error, "POST admin subscription-plans");
  }
}
