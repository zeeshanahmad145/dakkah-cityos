import {
  createWorkflow,
  WorkflowResponse,
  createStep,
  StepResponse,
} from "@medusajs/framework/workflows-sdk"

type CampaignActivationInput = {
  name: string
  type: string
  tenantId: string
  startDate: string
  endDate: string
  targetAudience: string[]
  budget: number
  promotionIds?: string[]
}

const createCampaignStep = createStep(
  "create-campaign-step",
  async (input: CampaignActivationInput) => {
    const campaign = {
      name: input.name,
      type: input.type,
      tenant_id: input.tenantId,
      budget: input.budget,
      target_audience: input.targetAudience,
      status: "draft",
      created_at: new Date(),
    }
    return new StepResponse({ campaign }, { campaign })
  },
  async (compensationData: { campaign: any } | undefined) => {
    if (!compensationData?.campaign) return
    try {
      compensationData.campaign.status = "cancelled"
    } catch (error) {
    }
  }
)

const scheduleCampaignStep = createStep(
  "schedule-campaign-step",
  async (input: { campaign: any; startDate: string; endDate: string }) => {
    const scheduled = {
      ...input.campaign,
      start_date: new Date(input.startDate),
      end_date: new Date(input.endDate),
      status: "scheduled",
    }
    return new StepResponse({ campaign: scheduled }, { campaign: input.campaign })
  },
  async (compensationData: { campaign: any } | undefined) => {
    if (!compensationData?.campaign) return
    try {
      compensationData.campaign.status = "draft"
    } catch (error) {
    }
  }
)

const activateCampaignStep = createStep(
  "activate-campaign-step",
  async (input: { campaign: any; promotionIds?: string[] }) => {
    const activated = {
      ...input.campaign,
      status: "active",
      promotion_ids: input.promotionIds || [],
      activated_at: new Date(),
    }
    return new StepResponse({ campaign: activated }, { campaign: input.campaign })
  },
  async (compensationData: { campaign: any } | undefined) => {
    if (!compensationData?.campaign) return
    try {
      compensationData.campaign.status = "scheduled"
    } catch (error) {
    }
  }
)

export const campaignActivationWorkflow = createWorkflow(
  "campaign-activation-workflow",
  (input: CampaignActivationInput) => {
    const { campaign } = createCampaignStep(input)
    const scheduled = scheduleCampaignStep({ campaign, startDate: input.startDate, endDate: input.endDate })
    const activated = activateCampaignStep({ campaign: scheduled.campaign, promotionIds: input.promotionIds })
    return new WorkflowResponse({ campaign: activated.campaign })
  }
)
