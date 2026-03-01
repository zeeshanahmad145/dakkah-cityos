import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { z } from "zod";
import { handleApiError } from "../../../../../lib/api-error-handler";
import { createLogger } from "../../../../../lib/logger";

const updateCreditSchema = z
  .object({
    credit_limit: z.number().optional(),
    payment_terms_days: z.number().optional(),
    reason: z.string().optional(),
  })
  .passthrough();

const adjustCreditSchema = z
  .object({
    amount: z.number(),
    type: z.enum(["add", "subtract", "reset"]),
    reason: z.string(),
  })
  .passthrough();
const logger = createLogger("api:admin/companies");

// Get credit details and history
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const query = req.scope.resolve("query") as unknown as any;
    const { id } = req.params;

    const {
      data: [company],
    } = await query.graph({
      entity: "company",
      fields: [
        "id",
        "name",
        "credit_limit",
        "credit_used",
        "payment_terms_days",
        "tier",
      ],
      filters: { id },
    });

    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }

    // Calculate available credit
    const creditLimit = parseFloat(company.credit_limit || "0");
    const creditUsed = parseFloat(company.credit_used || "0");
    const availableCredit = creditLimit - creditUsed;

    res.json({
      company_id: id,
      credit_limit: creditLimit,
      credit_used: creditUsed,
      available_credit: availableCredit,
      payment_terms_days: company.payment_terms_days,
      tier: company.tier,
    });
  } catch (error: unknown) {
    handleApiError(res, error, "GET admin companies id credit");
  }
}

// Adjust credit limit
export async function PUT(req: MedusaRequest, res: MedusaResponse) {
  try {
    const companyModuleService = req.scope.resolve("company") as unknown as any;
    const { id } = req.params;
    const parsed = updateCreditSchema.safeParse(req.body);
    if (!parsed.success) {
      return res
        .status(400)
        .json({ message: "Validation failed", errors: parsed.error.issues });
    }
    const { credit_limit, payment_terms_days, reason } = parsed.data;

    const updateData: Record<string, any> = {};
    if (credit_limit !== undefined)
      updateData.credit_limit = credit_limit.toString();
    if (payment_terms_days !== undefined)
      updateData.payment_terms_days = payment_terms_days;

    const company = await companyModuleService.updateCompanies({
      id,
      ...updateData,
    });

    // Log the credit adjustment (could store in metadata or separate audit table)
    logger.info(
      `Credit adjusted for company ${id}: ${JSON.stringify({ credit_limit, payment_terms_days, reason })}`,
    );

    res.json({ company });
  } catch (error: unknown) {
    handleApiError(res, error, "PUT admin companies id credit");
  }
}

// Manual credit adjustment (add/subtract from credit_used)
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const query = req.scope.resolve("query") as unknown as any;
    const companyModuleService = req.scope.resolve("company") as unknown as any;
    const { id } = req.params;
    const parsed = adjustCreditSchema.safeParse(req.body);
    if (!parsed.success) {
      return res
        .status(400)
        .json({ message: "Validation failed", errors: parsed.error.issues });
    }
    const { amount, type, reason } = parsed.data;

    const {
      data: [company],
    } = await query.graph({
      entity: "company",
      fields: ["id", "credit_used"],
      filters: { id },
    });

    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }

    let newCreditUsed: number;
    const currentUsed = parseFloat(company.credit_used || "0");

    switch (type) {
      case "add":
        newCreditUsed = currentUsed + amount;
        break;
      case "subtract":
        newCreditUsed = Math.max(0, currentUsed - amount);
        break;
      case "reset":
        newCreditUsed = 0;
        break;
      default:
        return res.status(400).json({ message: "Invalid adjustment type" });
    }

    const updated = await companyModuleService.updateCompanies({
      id,
      credit_used: newCreditUsed.toString(),
    });

    logger.info(
      `Credit usage adjusted for company ${id}: ${type} ${amount}, reason: ${reason}`,
    );

    res.json({
      company_id: id,
      previous_credit_used: currentUsed,
      new_credit_used: newCreditUsed,
      adjustment_type: type,
      adjustment_amount: amount,
      reason,
    });
  } catch (error: unknown) {
    handleApiError(res, error, "POST admin companies id credit");
  }
}
