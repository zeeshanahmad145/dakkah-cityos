import { MedusaRequest, MedusaResponse } from "@medusajs/framework";
import { z } from "zod";
import { handleApiError } from "../../../lib/api-error-handler";

interface ICompanyService {
  listCompanies(
    filters: Record<string, unknown>,
    config?: { skip?: number; take?: number; order?: Record<string, string> },
  ): Promise<[Array<Record<string, unknown>>, number]>;
}

// Validation schemas
const createCompanySchema = z
  .object({
    name: z.string().min(1),
    legal_name: z.string().optional(),
    email: z.string().email(),
    phone: z.string().optional(),
    tax_id: z.string().optional(),
    industry: z.string().optional(),
    customer_id: z.string(),
    store_id: z.string().optional(),
    credit_limit: z.string().optional(),
    payment_terms_days: z.number().optional(),
    tier: z.enum(["bronze", "silver", "gold", "platinum"]).optional(),
  })
  .passthrough();

/**
 * GET /admin/companies
 * List all B2B companies
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const companyService = req.scope.resolve(
    "companyModuleService",
  ) as unknown as ICompanyService;
  const tenantId =
    (req.scope.resolve("tenantId") as unknown as string | null) ?? "";

  const { status, tier, limit = 20, offset = 0 } = req.query;

  const filters: Record<string, unknown> = { tenant_id: tenantId };

  if (status) filters.status = status;
  if (tier) filters.tier = tier;

  const [companies, count] = await companyService.listCompanies(filters, {
    skip: Number(offset),
    take: Number(limit),
    order: { created_at: "DESC" },
  });

  res.json({
    companies,
    count: Array.isArray(companies) ? companies.length : 0,
    limit: Number(limit),
    offset: Number(offset),
  });
}

/**
 * POST /admin/companies
 * Create new B2B company
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const tenantId =
    (req.scope.resolve("tenantId") as unknown as string | null) ?? "";
  const parsed = createCompanySchema.safeParse(req.body);
  if (!parsed.success) {
    return res
      .status(400)
      .json({ message: "Validation failed", errors: parsed.error.issues });
  }

  const { createCompanyWorkflow } = await import(
    "../../../workflows/b2b/create-company-workflow.js"
  );

  const { result } = await createCompanyWorkflow(req.scope).run({
    input: {
      ...parsed.data,
      tenant_id: tenantId,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as unknown as any,
  });

  res.json({ company: result.company });
}
