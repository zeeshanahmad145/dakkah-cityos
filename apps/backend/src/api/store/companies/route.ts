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

const SEED_COMPANIES = [
  {
    id: "company-seed-1",
    name: "Acme Corporation",
    legal_name: "Acme Corp Inc.",
    industry: "Manufacturing",
    status: "approved",
    tier: "gold",
    employee_count: 250,
    email: "procurement@acme.com",
    phone: "+1-555-0100",
    credit_limit: 50000000,
    credit_used: 12500000,
    thumbnail: "/seed-images/b2b/1486406146926-c627a92ad1ab.jpg",
  },
  {
    id: "company-seed-2",
    name: "TechStart Solutions",
    legal_name: "TechStart Solutions LLC",
    industry: "Technology",
    status: "approved",
    tier: "silver",
    employee_count: 45,
    email: "orders@techstart.io",
    phone: "+1-555-0200",
    credit_limit: 25000000,
    credit_used: 8200000,
    thumbnail: "/seed-images/b2b/1504384308090-c894fdcc538d.jpg",
  },
  {
    id: "company-seed-3",
    name: "Global Logistics Ltd",
    legal_name: "Global Logistics Limited",
    industry: "Logistics",
    status: "approved",
    tier: "platinum",
    employee_count: 1200,
    email: "supply@globallogistics.com",
    phone: "+1-555-0300",
    credit_limit: 100000000,
    credit_used: 45000000,
    thumbnail: "/seed-images/consignments/1548036328-c9fa89d128fa.jpg",
  },
  {
    id: "company-seed-4",
    name: "Green Earth Supplies",
    legal_name: "Green Earth Supplies Co.",
    industry: "Sustainability",
    status: "pending",
    tier: "bronze",
    employee_count: 30,
    email: "info@greenearthsupplies.com",
    phone: "+1-555-0400",
    credit_limit: 10000000,
    credit_used: 0,
    thumbnail: "/seed-images/charity/1469571486292-0ba58a3f068b.jpg",
  },
  {
    id: "company-seed-5",
    name: "MediSupply Corp",
    legal_name: "MediSupply Corporation",
    industry: "Healthcare",
    status: "approved",
    tier: "gold",
    employee_count: 180,
    email: "orders@medisupply.com",
    phone: "+1-555-0500",
    credit_limit: 75000000,
    credit_used: 22000000,
    thumbnail: "/seed-images/healthcare/1551836022-d5d88e9218df.jpg",
  },
]

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const companyService = req.scope.resolve("company") as any;

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
      status: "pending",
      tier: "bronze",
      credit_limit: "0",
      payment_terms_days: 30,
    });

    await companyService.createCompanyUsers({
      company_id: company.id,
      customer_id: customerId,
      role: "admin",
      is_active: true,
    });

    res.json({ company });
  } catch (error: any) {
    handleApiError(res, error, "POST store companies")
  }
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const companyService = req.scope.resolve("company") as any;

    if (!req.auth_context?.actor_id) {
      return res.json({ companies: SEED_COMPANIES });
    }

    const customerId = req.auth_context.actor_id;

    const companyUsers = await companyService.listCompanyUsers({
      customer_id: customerId,
    });

    const companyIds = companyUsers.map((cu: any) => cu.company_id);
    const companies = await companyService.listCompanies({
      id: companyIds,
    });

    res.json({ companies: companies.length > 0 ? companies : SEED_COMPANIES });
  } catch (error: any) {
    return res.json({ companies: SEED_COMPANIES })
  }
}
