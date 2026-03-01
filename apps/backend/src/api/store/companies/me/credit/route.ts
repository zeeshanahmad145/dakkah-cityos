import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { handleApiError } from "../../../../../lib/api-error-handler";

/**
 * GET /store/companies/me/credit
 * Get company credit information
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const companyModule = req.scope.resolve("company") as unknown as any;

  if (!req.auth_context?.actor_id) {
    return res.status(401).json({ message: "Authentication required" });
  }

  const customerId = req.auth_context.actor_id;

  try {
    // Find customer's company
    const employees = await companyModule.listCompanyUsers({
      customer_id: customerId,
    });

    const employeeList = Array.isArray(employees)
      ? employees
      : [employees].filter(Boolean);

    if (employeeList.length === 0) {
      return res.status(404).json({
        message: "You are not associated with any company",
      });
    }

    const employee = employeeList[0];
    const company = await companyModule.retrieveCompany(employee.company_id);

    // Calculate credit details
    const creditLimit = Number(company.credit_limit || 0);
    const creditUsed = Number(company.credit_used || 0);
    const availableCredit = creditLimit - creditUsed;
    const utilizationPercent =
      creditLimit > 0 ? (creditUsed / creditLimit) * 100 : 0;

    // Get pending POs that will use credit
    const pendingPOs = await companyModule.listPurchaseOrders({
      company_id: company.id,
      status: ["pending_approval", "approved", "processing"],
    });

    const poList = Array.isArray(pendingPOs)
      ? pendingPOs
      : [pendingPOs].filter(Boolean);
    const pendingAmount = poList.reduce(
      (sum: number, po: any) => sum + Number(po.total || 0),
      0,
    );

    res.json({
      credit: {
        limit: creditLimit,
        used: creditUsed,
        available: availableCredit,
        pending: pendingAmount,
        effective_available: Math.max(0, availableCredit - pendingAmount),
        utilization_percent: Math.round(utilizationPercent * 100) / 100,
        payment_terms: company.payment_terms,
        currency: "USD",
      },
      company: {
        id: company.id,
        name: company.name,
        is_verified: company.is_verified,
      },
    });
  } catch (error: unknown) {
    handleApiError(res, error, "STORE-COMPANIES-ME-CREDIT");
  }
}
