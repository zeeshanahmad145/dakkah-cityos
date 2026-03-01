import {
  createWorkflow,
  WorkflowResponse,
  createStep,
  StepResponse,
} from "@medusajs/framework/workflows-sdk";
import { createLogger } from "../../lib/logger";
const logger = createLogger("workflows:b2b");

interface CreateCompanyInput {
  name: string;
  legal_name?: string;
  email: string;
  phone?: string;
  tax_id?: string;
  industry?: string;
  tenant_id: string;
  store_id?: string;
  customer_id: string; // Primary contact
  credit_limit?: string;
  payment_terms_days?: number;
  tier?: string;
}

// Step 1: Create company
const createCompanyStep = createStep(
  "create-company",
  async (input: CreateCompanyInput, { container }) => {
    const companyService = container.resolve("company") as unknown as any;

    const company = await companyService.createCompanies({
      name: input.name,
      legal_name: input.legal_name,
      email: input.email,
      phone: input.phone,
      tax_id: input.tax_id,
      industry: input.industry,
      tenant_id: input.tenant_id,
      store_id: input.store_id,
      status: "pending",
      tier: input.tier || "bronze",
      credit_limit: input.credit_limit || "0",
      credit_used: "0",
      payment_terms_days: input.payment_terms_days || 30,
      requires_approval: true,
    });

    return new StepResponse({ company, input }, { companyId: company.id });
  },
  async (compensationData: { companyId: string }, { container }) => {
    if (!compensationData?.companyId) return;
    try {
      const companyService = container.resolve("company") as unknown as any;
      await companyService.deleteCompanies(compensationData.companyId);
    } catch (error) {}
  },
);

// Step 2: Add primary contact as admin
const addCompanyAdminStep = createStep(
  "add-company-admin",
  async (
    {
      input,
      company,
    }: { input: CreateCompanyInput; company: Record<string, unknown> },
    { container },
  ) => {
    const companyService = container.resolve("company") as unknown as any;

    const companyUser = await companyService.createCompanyUsers({
      company_id: company.id,
      customer_id: input.customer_id,
      role: "admin",
      status: "active",
      joined_at: new Date(),
    });

    return new StepResponse({ companyUser }, { companyUserId: companyUser.id });
  },
  async (compensationData: { companyUserId: string }, { container }) => {
    if (!compensationData?.companyUserId) return;
    try {
      const companyService = container.resolve("company") as unknown as any;
      await companyService.deleteCompanyUsers(compensationData.companyUserId);
    } catch (error) {}
  },
);

// Step 3: Log company creation
const logCompanyCreationStep = createStep(
  "log-company-creation",
  async ({ company }: { company: Record<string, unknown> }, { container }) => {
    logger.info(
      `Company created: ${company.name} (${company.id}) - Status: pending approval`,
    );
    return new StepResponse({ logged: true }, null);
  },
);

/**
 * Create Company Workflow
 *
 * Registers a new B2B company and assigns the first admin user.
 * Company starts in pending status awaiting approval.
 */
export const createCompanyWorkflow = createWorkflow(
  "create-company",
  (input: CreateCompanyInput) => {
    // 1. Create company
    const { company } = createCompanyStep(input);

    // 2. Add primary contact as admin
    const { companyUser } = addCompanyAdminStep({ input, company });

    // 3. Log company creation
    logCompanyCreationStep({ company });

    return new WorkflowResponse({ company, companyUser });
  },
);
