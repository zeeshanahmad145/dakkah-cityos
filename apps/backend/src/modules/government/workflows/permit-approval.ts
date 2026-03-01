import {
  createWorkflow,
  createStep,
  StepResponse,
} from "@medusajs/framework/workflows-sdk";

/**
 * Government Permit Approval Workflow
 * Multi-stage: submit → review → approve/reject
 */
const submitApplicationStep = createStep(
  "submit-permit-application",
  async ({ applicationId }: { applicationId: string }, { container }) => {
    const governmentService = container.resolve("government") as unknown as any;
    const app = await governmentService.updatePermitApplications({
      id: applicationId,
      status: "submitted",
      submitted_at: new Date(),
    });
    return new StepResponse({ application: app }, { applicationId });
  },
  async ({ applicationId }: { applicationId: string }, { container }) => {
    const governmentService = container.resolve("government") as unknown as any;
    await governmentService.updatePermitApplications({
      id: applicationId,
      status: "draft",
    });
  },
);

const reviewApplicationStep = createStep(
  "review-permit-application",
  async ({ applicationId }: { applicationId: string }, { container }) => {
    const governmentService = container.resolve("government") as unknown as any;
    const app = await governmentService.updatePermitApplications({
      id: applicationId,
      status: "under_review",
      review_started_at: new Date(),
    });
    return new StepResponse({ application: app }, { applicationId });
  },
  async ({ applicationId }: { applicationId: string }, { container }) => {
    const governmentService = container.resolve("government") as unknown as any;
    await governmentService.updatePermitApplications({
      id: applicationId,
      status: "submitted",
    });
  },
);

const approveApplicationStep = createStep(
  "approve-permit-application",
  async (
    {
      applicationId,
      approved,
      reason,
    }: { applicationId: string; approved: boolean; reason?: string },
    { container },
  ) => {
    const governmentService = container.resolve("government") as unknown as any;
    const newStatus = approved ? "approved" : "rejected";
    const app = await governmentService.updatePermitApplications({
      id: applicationId,
      status: newStatus,
      decision_reason: reason || null,
      decided_at: new Date(),
    });
    return new StepResponse({ application: app, status: newStatus });
  },
);

export const permitApprovalWorkflow = createWorkflow(
  "permit-approval",
  // @ts-ignore: workflow builder type
  (input: { applicationId: string; approved?: boolean; reason?: string }) => {
    const submitted = submitApplicationStep({
      applicationId: input.applicationId,
    });
    const reviewed = reviewApplicationStep({
      applicationId: input.applicationId,
    });
    const approved = approveApplicationStep({
      applicationId: input.applicationId,
      approved: input.approved ?? true,
      reason: input.reason,
    });
    return { submitted, reviewed, approved };
  },
);
