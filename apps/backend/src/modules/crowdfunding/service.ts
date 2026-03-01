import { MedusaService } from "@medusajs/framework/utils";
import CrowdfundCampaign from "./models/campaign";
import Pledge from "./models/pledge";
import RewardTier from "./models/reward-tier";
import CampaignUpdate from "./models/campaign-update";
import Backer from "./models/backer";

class CrowdfundingModuleService extends MedusaService({
  CrowdfundCampaign,
  Pledge,
  RewardTier,
  CampaignUpdate,
  Backer,
}) {
  /** Create a pledge for a campaign */
  async pledge(
    campaignId: string,
    backerId: string,
    amount: number,
    rewardTierId?: string,
  ): Promise<any> {
    if (amount <= 0) {
      throw new Error("Pledge amount must be greater than zero");
    }

    const campaign = await this.retrieveCrowdfundCampaign(campaignId) as any;
    if (campaign.status !== "active") {
      throw new Error("Campaign is not accepting pledges");
    }

    if (rewardTierId) {
      const tier = await this.retrieveRewardTier(rewardTierId) as any;
      if (amount < Number(tier.minimum_amount || 0)) {
        throw new Error(
          `Minimum pledge for this reward is ${tier.minimum_amount}`,
        );
      }
    }

    const pledge = await this.createPledges({
      campaign_id: campaignId,
      backer_id: backerId,
      amount,
      reward_tier_id: rewardTierId || null,
      status: "active",
      pledged_at: new Date(),
    } as any);

    const currentAmount = Number(campaign.current_amount || 0);
    await this.updateCrowdfundCampaigns({
      id: campaignId,
      current_amount: currentAmount + amount,
      backer_count: Number(campaign.backer_count || 0) + 1,
    } as any);

    return pledge;
  }

  /** Get campaign status including funding progress */
  async getCampaignStatus(campaignId: string): Promise<{
    campaign: any;
    funded: boolean;
    percentage: number;
    remaining: number;
    daysLeft: number | null;
  }> {
    const campaign = await this.retrieveCrowdfundCampaign(campaignId) as any;
    const goal = Number(campaign.goal_amount || 0);
    const current = Number(campaign.current_amount || 0);
    const percentage =
      goal > 0 ? Math.round((current / goal) * 10000) / 100 : 0;

    let daysLeft: number | null = null;
    if (campaign.end_date) {
      const diff = new Date(campaign.end_date).getTime() - Date.now();
      daysLeft = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
    }

    return {
      campaign,
      funded: current >= goal,
      percentage,
      remaining: Math.max(0, goal - current),
      daysLeft,
    };
  }

  /** Process refunds for a failed campaign */
  async processRefunds(
    campaignId: string,
  ): Promise<{ refunded: number; count: number }> {
    const campaign = await this.retrieveCrowdfundCampaign(campaignId) as any;

    if (campaign.status !== "failed" && campaign.status !== "cancelled") {
      throw new Error(
        "Refunds can only be processed for failed or cancelled campaigns",
      );
    }

    const pledges = await this.listPledges({
      campaign_id: campaignId,
      status: "active",
    }) as any;
    const pledgeList = Array.isArray(pledges)
      ? pledges
      : [pledges].filter(Boolean);

    let totalRefunded = 0;
    for (const p of pledgeList) {
      await this.updatePledges({
        id: p.id,
        status: "refunded",
        refunded_at: new Date(),
      } as any);
      totalRefunded += Number(p.amount);
    }

    return { refunded: totalRefunded, count: pledgeList.length };
  }

  /** Check if campaign has met its funding goal */
  async checkFundingGoal(campaignId: string): Promise<boolean> {
    const campaign = await this.retrieveCrowdfundCampaign(campaignId) as any;
    const goal = Number(campaign.goal_amount || 0);
    const current = Number(campaign.current_amount || 0);
    return goal > 0 && current >= goal;
  }

  async launchCampaign(data: {
    creatorId: string;
    title: string;
    goalAmount: number;
    endDate: Date;
    rewardTiers?: Array<{
      title: string;
      minimumAmount: number;
      description?: string;
      limit?: number;
    }>;
  }): Promise<any> {
    if (!data.title || !data.title.trim()) {
      throw new Error("Campaign title is required");
    }
    if (data.goalAmount <= 0) {
      throw new Error("Goal amount must be greater than zero");
    }
    const endDate = new Date(data.endDate);
    if (endDate <= new Date()) {
      throw new Error("End date must be in the future");
    }
    const maxDuration = 90 * 24 * 60 * 60 * 1000;
    if (endDate.getTime() - Date.now() > maxDuration) {
      throw new Error("Campaign duration cannot exceed 90 days");
    }

    const campaign = await this.createCrowdfundCampaigns({
      creator_id: data.creatorId,
      title: data.title.trim(),
      goal_amount: data.goalAmount,
      current_amount: 0,
      backer_count: 0,
      end_date: endDate,
      status: "active",
      launched_at: new Date(),
    } as any);

    if (data.rewardTiers && data.rewardTiers.length > 0) {
      for (const tier of data.rewardTiers) {
        await this.createRewardTiers({
          campaign_id: campaign.id,
          title: tier.title,
          minimum_amount: tier.minimumAmount,
          description: tier.description || null,
          limit: tier.limit || null,
          claimed_count: 0,
        } as any);
      }
    }

    return campaign;
  }

  async getCampaignDashboard(campaignId: string): Promise<{
    campaign: any;
    raisedAmount: number;
    backerCount: number;
    daysRemaining: number | null;
    fundingPercentage: number;
    rewardTiers: any[];
    recentPledges: any[];
  }> {
    const campaign = await this.retrieveCrowdfundCampaign(campaignId) as any;
    const goal = Number(campaign.goal_amount || 0);
    const raised = Number(campaign.current_amount || 0);
    const fundingPercentage =
      goal > 0 ? Math.round((raised / goal) * 10000) / 100 : 0;

    let daysRemaining: number | null = null;
    if (campaign.end_date) {
      const diff = new Date(campaign.end_date).getTime() - Date.now();
      daysRemaining = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
    }

    const tiers = await this.listRewardTiers({
      campaign_id: campaignId,
    }) as any;
    const tierList = Array.isArray(tiers) ? tiers : [tiers].filter(Boolean);

    const pledges = await this.listPledges({
      campaign_id: campaignId,
    }) as any;
    const pledgeList = Array.isArray(pledges)
      ? pledges
      : [pledges].filter(Boolean);
    const recentPledges = pledgeList
      .sort(
        (a: any, b: any) =>
          new Date(b.pledged_at || b.created_at).getTime() -
          new Date(a.pledged_at || a.created_at).getTime(),
      )
      .slice(0, 10);

    return {
      campaign,
      raisedAmount: raised,
      backerCount: Number(campaign.backer_count || pledgeList.length),
      daysRemaining,
      fundingPercentage,
      rewardTiers: tierList,
      recentPledges,
    };
  }

  async claimReward(pledgeId: string): Promise<any> {
    const pledge = await this.retrievePledge(pledgeId) as any;

    if (pledge.status !== "active") {
      throw new Error("Only active pledges can claim rewards");
    }
    if (!pledge.reward_tier_id) {
      throw new Error("This pledge has no associated reward tier");
    }

    const campaign = await this.retrieveCrowdfundCampaign(pledge.campaign_id) as any;
    const goal = Number(campaign.goal_amount || 0);
    const current = Number(campaign.current_amount || 0);
    if (current < goal) {
      throw new Error("Campaign has not met its funding goal yet");
    }

    const tier = await this.retrieveRewardTier(pledge.reward_tier_id) as any;
    if (tier.limit && Number(tier.claimed_count || 0) >= Number(tier.limit)) {
      throw new Error("All rewards for this tier have been claimed");
    }

    await this.updateRewardTiers({
      id: tier.id,
      claimed_count: (Number(tier.claimed_count) || 0) + 1,
    } as any);

    return await this.updatePledges({
      id: pledgeId,
      status: "reward_claimed",
      reward_claimed_at: new Date(),
    } as any);
  }
}

export default CrowdfundingModuleService;
