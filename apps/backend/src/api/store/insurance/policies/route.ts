import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { handleApiError } from "../../../../lib/api-error-handler";

/**
 * GET /store/insurance/policies
 * List the customer's active insurance policies.
 *
 * POST /store/insurance/policies
 * Enroll in an insurance policy.
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const insuranceService = req.scope.resolve("insurance") as unknown as any;
    const customerId = req.auth_context?.actor_id;

    if (!customerId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const policies = await insuranceService.listInsPolicys({
      customer_id: customerId,
    });
    const list = Array.isArray(policies)
      ? policies
      : [policies].filter(Boolean);

    return res.json({ policies: list, count: list.length });
  } catch (error: unknown) {
    return handleApiError(res, error, "STORE-INSURANCE-POLICIES-LIST");
  }
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const insuranceService = req.scope.resolve("insurance") as unknown as any;
    const customerId = req.auth_context?.actor_id;

    if (!customerId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const { product_id, plan_type, coverage_amount, premium, start_date } =
      req.body as {
        product_id: string;
        plan_type: string;
        coverage_amount: number;
        premium: number;
        start_date?: string;
      };

    if (!product_id || !plan_type || !coverage_amount || !premium) {
      return res.status(400).json({
        error:
          "product_id, plan_type, coverage_amount, and premium are required",
      });
    }

    const policy = await insuranceService.createPolicy({
      customerId,
      productId: product_id,
      planType: plan_type,
      coverageAmount: coverage_amount,
      premium,
      startDate: start_date ? new Date(start_date) : new Date(),
    });

    return res.status(201).json({ policy });
  } catch (error: unknown) {
    return handleApiError(res, error, "STORE-INSURANCE-POLICIES-CREATE");
  }
}
