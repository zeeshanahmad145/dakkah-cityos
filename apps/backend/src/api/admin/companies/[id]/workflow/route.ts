import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { z } from "zod";
import { handleApiError } from "../../../../../lib/api-error-handler";

const updateWorkflowSchema = z
  .object({
    workflow: z.object({
      enabled: z.boolean(),
      auto_approve_threshold: z.number(),
      steps: z.array(
        z.object({
          id: z.string(),
          name: z.string(),
          threshold: z.number(),
          required_role: z.string(),
          notify_on_pending: z.boolean(),
        }),
      ),
      escalation_hours: z.number(),
      notify_email: z.string().optional(),
    }),
  })
  .passthrough();

// B2B Approval Workflow Configuration
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
        "requires_approval",
        "auto_approve_limit",
        "metadata",
      ],
      filters: { id },
    });

    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }

    // Get workflow from metadata or return defaults
    const metadata = company.metadata || {};
    const workflow = metadata.approval_workflow || {
      enabled: company.requires_approval,
      auto_approve_threshold: company.auto_approve_limit || 0,
      steps: [
        {
          id: "step_1",
          name: "Manager Approval",
          threshold: 1000,
          required_role: "approver",
          notify_on_pending: true,
        },
        {
          id: "step_2",
          name: "Finance Approval",
          threshold: 5000,
          required_role: "admin",
          notify_on_pending: true,
        },
      ],
      escalation_hours: 24,
      notify_email: company.email,
    };

    res.json({ company_id: id, workflow });
  } catch (error: unknown) {
    handleApiError(res, error, "GET admin companies id workflow");
  }
}

export async function PUT(req: MedusaRequest, res: MedusaResponse) {
  try {
    const query = req.scope.resolve("query") as unknown as any;
    const companyService = req.scope.resolve("company") as unknown as any;
    const { id } = req.params;
    const parsed = updateWorkflowSchema.safeParse(req.body);
    if (!parsed.success) {
      return res
        .status(400)
        .json({ message: "Validation failed", errors: parsed.error.issues });
    }
    const { workflow } = parsed.data;

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

    // Update company with new workflow
    await companyService.updateCompanies({
      id,
      requires_approval: workflow.enabled,
      auto_approve_limit: workflow.auto_approve_threshold.toString(),
      metadata: {
        ...company.metadata,
        approval_workflow: workflow,
      },
    });

    res.json({
      company_id: id,
      workflow,
      message: "Workflow configuration updated",
    });
  } catch (error: unknown) {
    handleApiError(res, error, "PUT admin companies id workflow");
  }
}
