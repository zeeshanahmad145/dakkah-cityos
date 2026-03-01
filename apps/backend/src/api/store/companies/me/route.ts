import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { handleApiError } from "../../../../lib/api-error-handler";

/**
 * GET /store/companies/me
 * Get customer's company information
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const companyModule = req.scope.resolve("company") as unknown as any;

  if (!req.auth_context?.actor_id) {
    return res.status(401).json({ message: "Authentication required" });
  }

  const customerId = req.auth_context.actor_id;

  try {
    // Find employee record for this customer
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

    // Get company details
    const company = await companyModule.retrieveCompany(employee.company_id);

    // Get company statistics
    const stats = {
      employee_count: 0,
      pending_orders: 0,
      total_spend_this_month: 0,
    };

    // Count employees
    const allEmployees = await companyModule.listCompanyUsers({
      company_id: company.id,
    });
    stats.employee_count = (
      Array.isArray(allEmployees)
        ? allEmployees
        : [allEmployees].filter(Boolean)
    ).length;

    // Count pending POs
    const pendingPOs = await companyModule.listPurchaseOrders({
      company_id: company.id,
      status: "pending_approval",
    });
    stats.pending_orders = (
      Array.isArray(pendingPOs) ? pendingPOs : [pendingPOs].filter(Boolean)
    ).length;

    res.json({
      company: {
        id: company.id,
        name: company.name,
        tax_id: company.tax_id,
        industry: company.industry,
        credit_limit: company.credit_limit,
        credit_used: company.credit_used,
        available_credit:
          Number(company.credit_limit || 0) - Number(company.credit_used || 0),
        payment_terms: company.payment_terms,
        status: company.status,
        is_verified: company.is_verified,
        created_at: company.created_at,
      },
      employee: {
        id: employee.id,
        role: employee.role,
        job_title: employee.job_title,
        department: employee.department,
        spending_limit: employee.spending_limit,
        can_approve_orders: employee.can_approve_orders,
        is_primary_contact: employee.is_primary_contact,
      },
      stats,
    });
  } catch (error: unknown) {
    handleApiError(res, error, "STORE-COMPANIES-ME");
  }
}
