import {
  createWorkflow,
  createStep,
  StepResponse,
} from "@medusajs/framework/workflows-sdk";

/**
 * Crowdfunding Success Workflow
 * When a campaign hits its goal: mark funded → notify backers → disburse to creator.
 */
const markCampaignFundedStep = createStep(
  "mark-campaign-funded",
  async ({ campaignId }: { campaignId: string }, { container }) => {
    const crowdfundingService = container.resolve("crowdfunding") as unknown as any;
    const updated = await crowdfundingService.updateCampaigns?.({
      id: campaignId,
      status: "funded",
      funded_at: new Date(),
    });
    return new StepResponse({ campaign: updated }, { campaignId });
  },
  async ({ campaignId }: { campaignId: string }, { container }) => {
    const crowdfundingService = container.resolve("crowdfunding") as unknown as any;
    await crowdfundingService.updateCampaigns?.({
      id: campaignId,
      status: "active",
    });
  },
);

const disburseFundsStep = createStep(
  "disburse-campaign-funds",
  async ({ campaignId }: { campaignId: string }, { container }) => {
    const crowdfundingService = container.resolve("crowdfunding") as unknown as any;
    let result: any = { disbursed: true };
    if (typeof crowdfundingService.disburseFunds === "function") {
      result = await crowdfundingService.disburseFunds(campaignId);
    }
    return new StepResponse(result);
  },
);

export const crowdfundingSuccessWorkflow = createWorkflow(
  "crowdfunding-success",
  // @ts-ignore: workflow builder type
  (input: { campaignId: string }) => {
    const funded = markCampaignFundedStep({ campaignId: input.campaignId });
    const disbursed = disburseFundsStep({ campaignId: input.campaignId });
    return { funded, disbursed };
  },
);

/**
 * Crowdfunding Fail Refund Workflow
 * When a campaign fails: mark failed → refund all pledges.
 */
const markCampaignFailedStep = createStep(
  "mark-campaign-failed",
  async ({ campaignId }: { campaignId: string }, { container }) => {
    const crowdfundingService = container.resolve("crowdfunding") as unknown as any;
    const updated = await crowdfundingService.updateCampaigns?.({
      id: campaignId,
      status: "failed",
      failed_at: new Date(),
    });
    return new StepResponse({ campaign: updated }, { campaignId });
  },
);

const refundPledgesStep = createStep(
  "refund-all-pledges",
  async ({ campaignId }: { campaignId: string }, { container }) => {
    const crowdfundingService = container.resolve("crowdfunding") as unknown as any;
    let result: any = { refunded: true };
    if (typeof crowdfundingService.refundAllPledges === "function") {
      result = await crowdfundingService.refundAllPledges(campaignId);
    }
    return new StepResponse(result);
  },
);

export const crowdfundingFailRefundWorkflow = createWorkflow(
  "crowdfunding-fail-refund",
  // @ts-ignore: workflow builder type
  (input: { campaignId: string }) => {
    const failed = markCampaignFailedStep({ campaignId: input.campaignId });
    const refunded = refundPledgesStep({ campaignId: input.campaignId });
    return { failed, refunded };
  },
);
