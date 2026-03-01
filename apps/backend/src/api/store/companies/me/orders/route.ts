import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { handleApiError } from "../../../../../lib/api-error-handler";

/**
 * GET /store/companies/me/orders
 * Get all company orders (for admins/managers)
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const companyModule = req.scope.resolve("company") as unknown as any;
  const query = req.scope.resolve("query") as unknown as any;

  if (!req.auth_context?.actor_id) {
    return res.status(401).json({ message: "Authentication required" });
  }

  const customerId = req.auth_context.actor_id;
  const { offset = 0, limit = 20, status, type = "all" } = req.query;

  try {
    // Find customer's company and verify they have access to company orders
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

    // Only admins and managers can view all company orders
    if (!["admin", "manager"].includes(employee.role)) {
      return res.status(403).json({
        message: "You don't have permission to view company orders",
      });
    }

    const company = await companyModule.retrieveCompany(employee.company_id);

    // Get all employees to find their customer IDs
    const allEmployees = await companyModule.listCompanyUsers({
      company_id: company.id,
    });

    const allEmployeeList = Array.isArray(allEmployees)
      ? allEmployees
      : [allEmployees].filter(Boolean);
    const companyCustomerIds = allEmployeeList
      .map((e: any) => e.customer_id)
      .filter(Boolean);

    let orders: any[] = [];
    let purchaseOrders: any[] = [];

    // Fetch regular orders if requested
    if (type === "all" || type === "orders") {
      if (companyCustomerIds.length > 0) {
        const { data: regularOrders } = await query.graph({
          entity: "order",
          fields: [
            "id",
            "display_id",
            "status",
            "total",
            "currency_code",
            "created_at",
            "customer.*",
          ],
          filters: {
            customer_id: companyCustomerIds,
            ...(status ? { status } : {}),
          },
          pagination: {
            skip: Number(offset),
            take: Number(limit),
          },
        });
        orders = regularOrders;
      }
    }

    // Fetch purchase orders if requested
    if (type === "all" || type === "purchase_orders") {
      const poFilters: Record<string, unknown> = { company_id: company.id };
      if (status) poFilters.status = status;

      const pos = await companyModule.listPurchaseOrders(poFilters, {
        skip: Number(offset),
        take: Number(limit),
        order: { created_at: "DESC" },
      });

      purchaseOrders = Array.isArray(pos) ? pos : [pos].filter(Boolean);
    }

    res.json({
      orders,
      purchase_orders: purchaseOrders,
      company: {
        id: company.id,
        name: company.name,
      },
      offset: Number(offset),
      limit: Number(limit),
    });
  } catch (error: unknown) {
    handleApiError(res, error, "STORE-COMPANIES-ME-ORDERS");
  }
}
