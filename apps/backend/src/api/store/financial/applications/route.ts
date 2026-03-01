import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { handleApiError } from "../../../../lib/api-error-handler";

/**
 * GET  /store/financial/applications  — list customer's loan/investment applications
 * POST /store/financial/applications  — submit a new application
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const financialService = req.scope.resolve("financialProduct") as unknown as any;
    const customerId = req.auth_context?.actor_id;

    if (!customerId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const applications = await financialService.listLoanApplications({
      customer_id: customerId,
    });
    const list = Array.isArray(applications)
      ? applications
      : [applications].filter(Boolean);

    return res.json({ applications: list, count: list.length });
  } catch (error: unknown) {
    return handleApiError(res, error, "STORE-FINANCIAL-APPLICATIONS-LIST");
  }
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const financialService = req.scope.resolve("financialProduct") as unknown as any;
    const customerId = req.auth_context?.actor_id;

    if (!customerId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const { product_id, amount, term, purpose } = req.body as {
      product_id: string;
      amount: number;
      term: number;
      purpose?: string;
    };

    if (!product_id || !amount || !term) {
      return res
        .status(400)
        .json({ error: "product_id, amount, and term are required" });
    }

    const application = await financialService.applyForProduct(
      customerId,
      product_id,
      { amount, term, purpose },
    );

    return res.status(201).json({ application });
  } catch (error: unknown) {
    return handleApiError(res, error, "STORE-FINANCIAL-APPLICATIONS-CREATE");
  }
}
