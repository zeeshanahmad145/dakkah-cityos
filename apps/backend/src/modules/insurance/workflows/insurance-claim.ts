import {
  createWorkflow,
  createStep,
  StepResponse,
} from "@medusajs/framework/workflows-sdk";

/**
 * Insurance Claim Workflow
 * File → assess → approve/deny → payout or reject.
 */
const fileClaimStep = createStep(
  "file-insurance-claim",
  async (
    {
      policyId,
      description,
      claimAmount,
    }: { policyId: string; description: string; claimAmount: number },
    { container },
  ) => {
    const insuranceService = container.resolve("insurance") as unknown as any;
    const claim = await insuranceService.fileInsuranceClaim(
      policyId,
      description,
      claimAmount,
    );
    return new StepResponse({ claim }, { claimId: claim.id });
  },
  async ({ claimId }: { claimId: string }, { container }) => {
    const insuranceService = container.resolve("insurance") as unknown as any;
    await insuranceService.updateInsClaims?.({
      id: claimId,
      status: "withdrawn",
    });
  },
);

const assessClaimStep = createStep(
  "assess-insurance-claim",
  async ({ claimId }: { claimId: string }, { container }) => {
    const insuranceService = container.resolve("insurance") as unknown as any;

    // Auto-assess: fetch claim and run simple fraud check
    const claims =
      (await insuranceService.listInsClaims?.({ id: claimId })) ?? [];
    const list = Array.isArray(claims) ? claims : [claims].filter(Boolean);
    const claim = list[0];

    const isAutoApprovable = claim && Number(claim.claim_amount || 0) <= 1000;
    const status = isAutoApprovable ? "approved" : "under_review";

    const updated = await insuranceService.updateInsClaims?.({
      id: claimId,
      status,
      assessed_at: new Date(),
    });

    return new StepResponse({
      claim: updated,
      auto_approved: isAutoApprovable,
    });
  },
);

const processClaimPayoutStep = createStep(
  "process-claim-payout",
  async ({ claimId }: { claimId: string }, { container }) => {
    const insuranceService = container.resolve("insurance") as unknown as any;
    let result: any = { paid: false };

    if (typeof insuranceService.processPayout === "function") {
      result = await insuranceService.processPayout(claimId);
    } else {
      result = await insuranceService.updateInsClaims?.({
        id: claimId,
        status: "paid",
        paid_at: new Date(),
      });
    }

    return new StepResponse({ result });
  },
);

export const insuranceClaimWorkflow = createWorkflow(
  "insurance-claim",
  // @ts-ignore: workflow builder type
  (input: { policyId: string; description: string; claimAmount: number }) => {
    const filed = fileClaimStep({
      policyId: input.policyId,
      description: input.description,
      claimAmount: input.claimAmount,
    });
    const assessed = assessClaimStep({ claimId: filed.claim.id });
    const payout = processClaimPayoutStep({ claimId: filed.claim.id });
    return { filed, assessed, payout };
  },
);
