import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { z } from "zod"
import { handleApiError } from "../../../lib/api-error-handler"

const createCompanySchema = z.object({
  name: z.string().min(1),
  legal_name: z.string().optional(),
  tax_id: z.string().optional(),
  email: z.string().min(1),
  phone: z.string().optional(),
  industry: z.string().optional(),
  employee_count: z.number().optional(),
  annual_revenue: z.number().optional(),
  billing_address: z.record(z.string(), z.unknown()).optional(),
  tenant_id: z.string().min(1),
  store_id: z.string().optional(),
})

/**
 * POST /store/companies
 * Register a new B2B company account
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const companyService = req.scope.resolve("companyModuleService") as any;

  if (!req.auth_context?.actor_id) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const parsed = createCompanySchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ message: "Validation failed", errors: parsed.error.issues })
  }

  const {
    name,
    legal_name,
    tax_id,
    email,
    phone,
    industry,
    employee_count,
    annual_revenue,
    billing_address,
    tenant_id,
    store_id,
  } = parsed.data;

  const customerId = req.auth_context.actor_id;

  // Create company
  const company = await companyService.createCompanies({
    name,
    legal_name,
    tax_id,
    email,
    phone,
    industry,
    employee_count,
    annual_revenue,
    billing_address,
    tenant_id,
    store_id,
    status: "pending", // Requires approval
    tier: "bronze",
    credit_limit: "0",
    payment_terms_days: 30,
  });

  // Create company user (admin role for creator)
  await companyService.createCompanyUsers({
    company_id: company.id,
    customer_id: customerId,
    role: "admin",
    is_active: true,
  });

  res.json({ company });
}

/**
 * GET /store/companies
 * Get customer's companies
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const companyService = req.scope.resolve("companyModuleService") as any;

  if (!req.auth_context?.actor_id) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const customerId = req.auth_context.actor_id;

  // Find company users for this customer
  const companyUsers = await companyService.listCompanyUsers({
    customer_id: customerId,
  });

  // Get companies
  const companyIds = companyUsers.map((cu: any) => cu.company_id);
  const companies = await companyService.listCompanies({
    id: companyIds,
  });

  res.json({ companies });
}
