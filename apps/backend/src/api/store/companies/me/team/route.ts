import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { handleApiError } from "../../../../../lib/api-error-handler";

/**
 * GET /store/companies/me/team
 * Get company team members
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const companyModule = req.scope.resolve("company") as unknown as any;
  const query = req.scope.resolve("query") as unknown as any;

  if (!req.auth_context?.actor_id) {
    return res.status(401).json({ message: "Authentication required" });
  }

  const customerId = req.auth_context.actor_id;
  const { offset = 0, limit = 50, role } = req.query;

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

    const currentEmployee = employeeList[0];

    // Get all team members
    const filters: Record<string, unknown> = {
      company_id: currentEmployee.company_id,
    };
    if (role) filters.role = role;

    const teamMembers = await companyModule.listCompanyUsers(filters, {
      skip: Number(offset),
      take: Number(limit),
      order: { created_at: "DESC" },
    });

    const memberList = Array.isArray(teamMembers)
      ? teamMembers
      : [teamMembers].filter(Boolean);

    // Get customer details for each employee
    const customerIds = memberList
      .map((m: any) => m.customer_id)
      .filter(Boolean);

    let customerMap: Record<string, any> = {};

    if (customerIds.length > 0) {
      const { data: customers } = await query.graph({
        entity: "customer",
        fields: ["id", "email", "first_name", "last_name"],
        filters: { id: customerIds },
      });

      customerMap = customers.reduce((acc: Record<string, any>, c: any) => {
        acc[c.id] = c;
        return acc;
      }, {});
    }

    // Enrich team members with customer data
    const enrichedMembers = memberList.map((member: any) => {
      const customer = customerMap[member.customer_id];
      return {
        id: member.id,
        role: member.role,
        job_title: member.job_title,
        department: member.department,
        spending_limit: member.spending_limit,
        can_approve_orders: member.can_approve_orders,
        is_primary_contact: member.is_primary_contact,
        status: member.status,
        customer: customer
          ? {
              id: customer.id,
              email: customer.email,
              first_name: customer.first_name,
              last_name: customer.last_name,
              name: `${customer.first_name || ""} ${customer.last_name || ""}`.trim(),
            }
          : null,
        created_at: member.created_at,
      };
    });

    res.json({
      team_members: enrichedMembers,
      count: enrichedMembers.length,
      offset: Number(offset),
      limit: Number(limit),
    });
  } catch (error: unknown) {
    handleApiError(res, error, "STORE-COMPANIES-ME-TEAM");
  }
}
