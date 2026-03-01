import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { z } from "zod";
import { handleApiError } from "../../../../../lib/api-error-handler";

const createTaxExemptionSchema = z
  .object({
    certificate_number: z.string(),
    certificate_type: z.string(),
    issuing_state: z.string().optional(),
    expiration_date: z.string().optional(),
    document_url: z.string().optional(),
    exempt_categories: z.array(z.string()).optional(),
    notes: z.string().optional(),
  })
  .passthrough();

const updateTaxExemptionSchema = z
  .object({
    exemption_id: z.string(),
    status: z.enum(["pending", "verified", "expired", "rejected"]),
    verified_by: z.string().optional(),
    notes: z.string().optional(),
  })
  .passthrough();

// Get tax exemptions for a company
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const query = req.scope.resolve("query") as unknown as any;
  const { id } = req.params;

  // Check if tax_exemption entity exists, if not use company metadata
  try {
    const { data: exemptions } = await query.graph({
      entity: "tax_exemption",
      fields: ["*"],
      filters: { company_id: id },
    });

    res.json({ exemptions });
  } catch {
    // Fallback to company metadata
    const {
      data: [company],
    } = await query.graph({
      entity: "company",
      fields: ["id", "tax_id", "metadata"],
      filters: { id },
    });

    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }

    const exemptions = company.metadata?.tax_exemptions || [];
    res.json({ exemptions, source: "metadata" });
  }
}

// Add a tax exemption
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const query = req.scope.resolve("query") as unknown as any;
  const companyModuleService = req.scope.resolve("companyModuleService") as unknown as any;
  const { id } = req.params;
  const parsed = createTaxExemptionSchema.safeParse(req.body);
  if (!parsed.success) {
    return res
      .status(400)
      .json({ message: "Validation failed", errors: parsed.error.issues });
  }
  const {
    certificate_number,
    certificate_type,
    issuing_state,
    expiration_date,
    document_url,
    exempt_categories,
    notes,
  } = parsed.data;

  // Get current company metadata
  const {
    data: [company],
  } = await query.graph({
    entity: "company",
    fields: ["id", "metadata"],
    filters: { id },
  });

  if (!company) {
    return res.status(404).json({ message: "Company not found" });
  }

  const currentMetadata = company.metadata || {};
  const currentExemptions = currentMetadata.tax_exemptions || [];

  const newExemption = {
    id: `texmp_${Date.now()}`,
    certificate_number,
    certificate_type,
    issuing_state,
    expiration_date,
    document_url,
    exempt_categories,
    notes,
    status: "pending", // pending, verified, expired, rejected
    created_at: new Date().toISOString(),
    verified_at: null,
    verified_by: null,
  };

  const updatedMetadata = {
    ...currentMetadata,
    tax_exemptions: [...currentExemptions, newExemption],
  };

  await companyModuleService.updateCompanies({
    id,
    metadata: updatedMetadata,
  });

  res.status(201).json({ exemption: newExemption });
}

// Verify/Update a tax exemption
export async function PUT(req: MedusaRequest, res: MedusaResponse) {
  const query = req.scope.resolve("query") as unknown as any;
  const companyModuleService = req.scope.resolve("companyModuleService") as unknown as any;
  const { id } = req.params;
  const parsed = updateTaxExemptionSchema.safeParse(req.body);
  if (!parsed.success) {
    return res
      .status(400)
      .json({ message: "Validation failed", errors: parsed.error.issues });
  }
  const { exemption_id, status, verified_by, notes } = parsed.data;

  const {
    data: [company],
  } = await query.graph({
    entity: "company",
    fields: ["id", "metadata"],
    filters: { id },
  });

  if (!company) {
    return res.status(404).json({ message: "Company not found" });
  }

  const currentMetadata = company.metadata || {};
  const currentExemptions = currentMetadata.tax_exemptions || [];

  const exemptionIndex = currentExemptions.findIndex(
    (e: any) => e.id === exemption_id,
  );
  if (exemptionIndex === -1) {
    return res.status(404).json({ message: "Tax exemption not found" });
  }

  currentExemptions[exemptionIndex] = {
    ...currentExemptions[exemptionIndex],
    status,
    verified_at: status === "verified" ? new Date().toISOString() : null,
    verified_by: status === "verified" ? verified_by : null,
    notes: notes || currentExemptions[exemptionIndex].notes,
  };

  await companyModuleService.updateCompanies({
    id,
    metadata: { ...currentMetadata, tax_exemptions: currentExemptions },
  });

  res.json({ exemption: currentExemptions[exemptionIndex] });
}

// Delete a tax exemption
export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  const query = req.scope.resolve("query") as unknown as any;
  const companyModuleService = req.scope.resolve("companyModuleService") as unknown as any;
  const { id } = req.params;
  const { exemption_id } = req.query as { exemption_id: string };

  const {
    data: [company],
  } = await query.graph({
    entity: "company",
    fields: ["id", "metadata"],
    filters: { id },
  });

  if (!company) {
    return res.status(404).json({ message: "Company not found" });
  }

  const currentMetadata = company.metadata || {};
  const currentExemptions = currentMetadata.tax_exemptions || [];

  const updatedExemptions = currentExemptions.filter(
    (e: any) => e.id !== exemption_id,
  );

  await companyModuleService.updateCompanies({
    id,
    metadata: { ...currentMetadata, tax_exemptions: updatedExemptions },
  });

  res.json({ id: exemption_id, deleted: true });
}
