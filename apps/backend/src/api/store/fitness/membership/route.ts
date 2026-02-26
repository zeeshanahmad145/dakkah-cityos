import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { handleApiError } from "../../../../lib/api-error-handler";

export const AUTHENTICATE = false

const MEMBERSHIP_PLANS = [
  { id: "plan-session", name: "Drop-In Class", membership_type: "basic", price: 2500, period: "session", currency_code: "SAR", duration_months: 0, description: "Pay per individual class session" },
  { id: "plan-month", name: "Monthly Unlimited", membership_type: "premium", price: 15000, period: "month", currency_code: "SAR", duration_months: 1, description: "Unlimited classes for 30 days" },
  { id: "plan-year", name: "Annual Membership", membership_type: "vip", price: 144000, period: "year", currency_code: "SAR", duration_months: 12, description: "Best value - save 20% with annual commitment" },
]

export async function GET(_req: MedusaRequest, res: MedusaResponse) {
  return res.json({ plans: MEMBERSHIP_PLANS })
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const fitnessService = req.scope.resolve("fitness") as any;
    const { plan_id, customer_id } = req.body as { plan_id?: string; customer_id?: string };

    const plan = MEMBERSHIP_PLANS.find(p => p.id === plan_id)
    if (!plan) {
      return res.status(400).json({ error: "Invalid plan_id. Available: " + MEMBERSHIP_PLANS.map(p => p.id).join(", ") })
    }

    const cid = customer_id || `guest_${Date.now()}`
    const durationMonths = plan.duration_months > 0 ? plan.duration_months : 1
    const result = await fitnessService.createMembership(cid, {
      membershipType: plan.membership_type,
      monthlyFee: plan.price,
      currencyCode: plan.currency_code,
      durationMonths,
    })

    return res.json({
      membership: result,
      plan: plan.name,
      message: `${plan.name} membership activated successfully`,
    })
  } catch (error: any) {
    return handleApiError(res, error, "STORE-FITNESS-MEMBERSHIP");
  }
}
