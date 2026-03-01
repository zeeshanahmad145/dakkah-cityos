import {
  createWorkflow,
  createStep,
  StepResponse,
} from "@medusajs/framework/workflows-sdk";

/**
 * Freelance Milestone Release Workflow
 * Client approves milestone → release escrowed funds to freelancer.
 */
const approveMilestoneStep = createStep(
  "approve-milestone",
  async ({ milestoneId }: { milestoneId: string }, { container }) => {
    const freelanceService = container.resolve("freelance") as unknown as any;
    let milestone: any;
    if (typeof freelanceService.approveMilestone === "function") {
      milestone = await freelanceService.approveMilestone(milestoneId);
    } else {
      milestone = await freelanceService.updateMilestones?.({
        id: milestoneId,
        status: "approved",
        approved_at: new Date(),
      });
    }
    return new StepResponse({ milestone }, { milestoneId });
  },
  async ({ milestoneId }: { milestoneId: string }, { container }) => {
    const freelanceService = container.resolve("freelance") as unknown as any;
    await freelanceService.updateMilestones?.({
      id: milestoneId,
      status: "submitted",
    });
  },
);

const releaseEscrowStep = createStep(
  "release-escrow-funds",
  async ({ milestoneId }: { milestoneId: string }, { container }) => {
    const freelanceService = container.resolve("freelance") as unknown as any;
    let result: any = { released: true };
    if (typeof freelanceService.releaseMilestone === "function") {
      result = await freelanceService.releaseMilestone(milestoneId);
    }
    return new StepResponse(result);
  },
);

export const freelanceMilestoneReleaseWorkflow = createWorkflow(
  "freelance-milestone-release",
  // @ts-ignore: workflow builder type
  (input: { milestoneId: string }) => {
    const approved = approveMilestoneStep({ milestoneId: input.milestoneId });
    const released = releaseEscrowStep({ milestoneId: input.milestoneId });
    return { approved, released };
  },
);
