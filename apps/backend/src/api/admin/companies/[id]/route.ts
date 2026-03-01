import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { z } from "zod";
import { handleApiError } from "../../../../lib/api-error-handler";

const updateCompanySchema = z
  .object({
    name: z.string().optional(),
    legal_name: z.string().optional(),
    email: z.string().email().optional(),
    phone: z.string().optional(),
    tax_id: z.string().optional(),
    industry: z.string().optional(),
    status: z.string().optional(),
    tier: z.enum(["bronze", "silver", "gold", "platinum"]).optional(),
    credit_limit: z.string().optional(),
    payment_terms_days: z.number().optional(),
    requires_po: z.boolean().optional(),
    auto_approve_under: z.string().optional(),
    billing_address: z.record(z.string(), z.unknown()).optional(),
    shipping_address: z.record(z.string(), z.unknown()).optional(),
    metadata: z.record(z.string(), z.unknown()).optional(),
  })
  .passthrough();

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
        "email",
        "phone",
        "tax_id",
        "status",
        "tier",
        "credit_limit",
        "available_credit",
        "payment_terms_days",
        "requires_po",
        "auto_approve_under",
        "billing_address",
        "shipping_address",
        "metadata",
        "created_at",
        "updated_at",
        "users.*",
        "payment_terms.*",
        "tax_exemptions.*",
      ],
      filters: { id },
    });

    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }

    res.json({ company });
  } catch (error: unknown) {
    handleApiError(res, error, "GET admin companies id");
  }
}

export async function PUT(req: MedusaRequest, res: MedusaResponse) {
  try {
    const companyModuleService = req.scope.resolve("companyModuleService") as unknown as any;
    const { id } = req.params;
    const parsed = updateCompanySchema.safeParse(req.body);
    if (!parsed.success) {
      return res
        .status(400)
        .json({ message: "Validation failed", errors: parsed.error.issues });
    }

    const company = await companyModuleService.updateCompanies({
      id,
      ...parsed.data,
    });

    res.json({ company });
  } catch (error: unknown) {
    handleApiError(res, error, "PUT admin companies id");
  }
}

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  try {
    const companyModuleService = req.scope.resolve("companyModuleService") as unknown as any;
    const { id } = req.params;

    await companyModuleService.deleteCompanies(id);

    res.status(200).json({ id, deleted: true });
  } catch (error: unknown) {
    handleApiError(res, error, "DELETE admin companies id");
  }
}
