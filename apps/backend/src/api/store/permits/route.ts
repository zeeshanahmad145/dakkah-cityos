import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { permitApprovalWorkflow } from "../../../modules/government/workflows/permit-approval";
import { handleApiError } from "../../../lib/api-error-handler";

/**
 * GET  /store/permits  — list citizen's permits
 * POST /store/permits  — apply for a permit (creates application then triggers permit-approval workflow)
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const governmentService = req.scope.resolve("government") as unknown as any;
    const customerId = req.auth_context?.actor_id;

    if (!customerId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const { limit = "20", offset = "0" } = req.query as Record<
      string,
      string | undefined
    >;

    const permits = await governmentService.listPermits(
      { applicant_id: customerId },
      {
        skip: Number(offset),
        take: Number(limit),
      },
    );
    const list = Array.isArray(permits) ? permits : [permits].filter(Boolean);

    return res.json({
      permits: list,
      count: list.length,
      limit: Number(limit),
      offset: Number(offset),
    });
  } catch (error: unknown) {
    return handleApiError(res, error, "STORE-PERMITS-LIST");
  }
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const governmentService = req.scope.resolve("government") as unknown as any;
    const customerId = req.auth_context?.actor_id;

    if (!customerId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const { permit_type, description, location, metadata } = req.body as {
      permit_type: string;
      description: string;
      location?: string;
      metadata?: Record<string, unknown>;
    };

    if (!permit_type || !description) {
      return res
        .status(400)
        .json({ error: "permit_type and description are required" });
    }

    // 1. Create the permit application record in government module
    const application = await governmentService.createPermitApplications({
      applicant_id: customerId,
      permit_type,
      description,
      location: location ?? null,
      metadata: metadata ?? {},
      status: "draft",
      applied_at: new Date(),
    });

    // 2. Trigger workflow with the new application ID (submit → under_review)
    const { result } = await permitApprovalWorkflow(req.scope).run({
      input: { applicationId: application.id },
    });

    return res.status(201).json({
      message: "Permit application submitted successfully",
      permit: (result as any)?.submitted?.application ?? application,
    });
  } catch (error: unknown) {
    return handleApiError(res, error, "STORE-PERMITS-CREATE");
  }
}
