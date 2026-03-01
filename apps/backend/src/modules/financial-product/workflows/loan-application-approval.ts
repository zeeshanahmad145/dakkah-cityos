import {
  createStep,
  createWorkflow,
  StepResponse,
} from "@medusajs/framework/workflows-sdk";

// ─── Steps ────────────────────────────────────────────────────────────────────

const assessLoanApplication = createStep(
  "assess-loan-application",
  async (input: { applicationId: string }, { container }) => {
    const financialService = container.resolve("financial-product") as unknown as any;
    const assessment = await financialService.assessApplication(
      input.applicationId,
    );
    return new StepResponse(assessment);
  },
);

const approveLoanApplication = createStep(
  "approve-loan-application",
  async (
    input: {
      applicationId: string;
      approvedBy: string;
      interestRate?: number;
      fees?: number;
    },
    { container },
  ) => {
    const financialService = container.resolve("financial-product") as unknown as any;
    const result = await financialService.approveApplication(
      input.applicationId,
      input.approvedBy,
      { interestRate: input.interestRate, fees: input.fees },
    );
    return new StepResponse(result);
  },
  async (input: { applicationId: string }, { container }) => {
    const financialService = container.resolve("financial-product") as unknown as any;
    await financialService.rejectApplication(
      input.applicationId,
      "Approval cancelled during rollback",
    );
  },
);

const rejectLoanApplication = createStep(
  "reject-loan-application",
  async (input: { applicationId: string; reason: string }, { container }) => {
    const financialService = container.resolve("financial-product") as unknown as any;
    const result = await financialService.rejectApplication(
      input.applicationId,
      input.reason,
    );
    return new StepResponse(result);
  },
);

// ─── Workflow ─────────────────────────────────────────────────────────────────

export const loanApplicationApprovalWorkflow = createWorkflow(
  "loan-application-approval",
  // @ts-ignore: workflow builder return type
  (input: {
    applicationId: string;
    approvedBy: string;
    interestRate?: number;
    fees?: number;
  }) => {
    const assessment = assessLoanApplication({
      applicationId: input.applicationId,
    });
    const approved = approveLoanApplication({
      applicationId: input.applicationId,
      approvedBy: input.approvedBy,
      interestRate: input.interestRate,
      fees: input.fees,
    });
    return { assessment, approved };
  },
);
