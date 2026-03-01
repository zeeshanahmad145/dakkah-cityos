import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { handleApiError } from "../../../../lib/api-error-handler";

/**
 * GET  /store/financial/products   — list available loan/investment products
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const financialService = req.scope.resolve("financialProduct") as unknown as any;
    const {
      type,
      limit = "20",
      offset = "0",
    } = req.query as Record<string, string | undefined>;

    // Fetch both loan products and investment plans
    const [loanProducts, investmentPlans] = await Promise.all([
      financialService
        .listLoanProducts(
          type === "loan" || !type ? {} : { status: "inactive" },
          {
            skip: Number(offset),
            take: Number(limit),
          },
        )
        .catch(() => []),
      financialService
        .listInvestmentPlans(
          type === "investment" || !type ? {} : { status: "inactive" },
          {
            skip: Number(offset),
            take: Number(limit),
          },
        )
        .catch(() => []),
    ]);

    const loans = (Array.isArray(loanProducts) ? loanProducts : []).map(
      (p: any) => ({ ...p, product_type: "loan" }),
    );
    const investments = (
      Array.isArray(investmentPlans) ? investmentPlans : []
    ).map((p: any) => ({ ...p, product_type: "investment" }));

    const products =
      type === "loan"
        ? loans
        : type === "investment"
          ? investments
          : [...loans, ...investments];

    return res.json({
      products,
      count: products.length,
      limit: Number(limit),
      offset: Number(offset),
    });
  } catch (error: unknown) {
    return handleApiError(res, error, "STORE-FINANCIAL-PRODUCTS-LIST");
  }
}
