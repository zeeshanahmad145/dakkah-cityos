import {
  createWorkflow,
  createStep,
  StepResponse,
} from "@medusajs/framework/workflows-sdk";

/**
 * Dispute Resolution Workflow
 */
const autoAssignMediatorStep = createStep(
  "auto-assign-mediator",
  async ({ disputeId }: { disputeId: string }, { container }) => {
    const disputeService = container.resolve("dispute") as unknown as any;
    const assignment = await disputeService.autoAssignMediator(disputeId);
    return new StepResponse(assignment);
  },
);

const calculateCompensationStep = createStep(
  "calculate-compensation",
  async ({ disputeId }: { disputeId: string }, { container }) => {
    const disputeService = container.resolve("dispute") as unknown as any;
    const compensation = await disputeService.calculateCompensation(disputeId);
    return new StepResponse(compensation);
  },
);

const resolveDisputeStep = createStep(
  "resolve-dispute",
  async (
    {
      disputeId,
      resolution,
      refundAmount,
      resolvedBy,
    }: {
      disputeId: string;
      resolution: string;
      refundAmount?: number;
      resolvedBy: string;
    },
    { container },
  ) => {
    const disputeService = container.resolve("dispute") as unknown as any;
    const resolved = await disputeService.resolve({
      disputeId,
      resolution,
      resolutionAmount: refundAmount,
      resolvedBy,
    });
    return new StepResponse({ dispute: resolved }, { dispute: resolved });
  },
  async ({ dispute }: { dispute: any }, { container }) => {
    const disputeService = container.resolve("dispute") as unknown as any;
    await disputeService.updateDisputes({
      id: dispute?.id,
      status: "escalated",
    });
  },
);

// @ts-ignore: workflow return type
export const disputeResolutionWorkflow = createWorkflow(
  "dispute-resolution",
  // @ts-ignore: workflow builder type
  (input: {
    disputeId: string;
    autoAssign?: boolean;
    resolution?: string;
    resolvedBy?: string;
  }) => {
    const mediatorResult = autoAssignMediatorStep({
      disputeId: input.disputeId,
    });
    const compensation = calculateCompensationStep({
      disputeId: input.disputeId,
    });

    if (input.resolution && input.resolvedBy) {
      const resolved = resolveDisputeStep({
        disputeId: input.disputeId,
        resolution: input.resolution,
        refundAmount: compensation.compensationAmount,
        resolvedBy: input.resolvedBy,
      });
      return { mediatorResult, compensation, resolved };
    }

    return { mediatorResult, compensation };
  },
);
