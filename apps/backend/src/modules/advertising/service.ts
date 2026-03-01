import { MedusaService } from "@medusajs/framework/utils";
import AdCampaign from "./models/ad-campaign";
import AdPlacement from "./models/ad-placement";
import AdCreative from "./models/ad-creative";
import ImpressionLog from "./models/impression-log";
import AdAccount from "./models/ad-account";

class AdvertisingModuleService extends MedusaService({
  AdCampaign,
  AdPlacement,
  AdCreative,
  ImpressionLog,
  AdAccount,
}) {
  /** Create a new ad campaign with validation */
  async createCampaign(data: {
    accountId: string;
    name: string;
    budget: number;
    startDate: Date;
    endDate?: Date;
    targetAudience?: Record<string, unknown>;
    metadata?: Record<string, unknown>;
  }): Promise<any> {
    if (!data.name || data.budget <= 0) {
      throw new Error("Campaign name and positive budget are required");
    }

    if (data.endDate && data.endDate <= data.startDate) {
      throw new Error("End date must be after start date");
    }

    const account = await this.retrieveAdAccount(data.accountId) as any;
    if (account.status !== "active") {
      throw new Error("Ad account is not active");
    }

    return await this.createAdCampaigns({
      ad_account_id: data.accountId,
      name: data.name,
      budget: data.budget,
      spent: 0,
      impressions: 0,
      clicks: 0,
      start_date: data.startDate,
      end_date: data.endDate || null,
      target_audience: data.targetAudience || null,
      status: "draft",
      metadata: data.metadata || null,
    } as any);
  }

  /** Track an ad impression */
  async trackImpression(
    adCreativeId: string,
    metadata?: Record<string, unknown>,
  ): Promise<any> {
    const creative = await this.retrieveAdCreative(adCreativeId) as any;

    const log = await this.createImpressionLogs({
      ad_creative_id: adCreativeId,
      campaign_id: creative.campaign_id || creative.ad_campaign_id,
      type: "impression",
      timestamp: new Date(),
      metadata: metadata || null,
    } as any);

    if (creative.campaign_id || creative.ad_campaign_id) {
      const campaignId = creative.campaign_id || creative.ad_campaign_id;
      const campaign = await this.retrieveAdCampaign(campaignId) as any;
      await this.updateAdCampaigns({
        id: campaignId,
        impressions: Number(campaign.impressions || 0) + 1,
      } as any);
    }

    return log;
  }

  /** Track an ad click */
  async trackClick(
    adCreativeId: string,
    metadata?: Record<string, unknown>,
  ): Promise<any> {
    const creative = await this.retrieveAdCreative(adCreativeId) as any;

    const log = await this.createImpressionLogs({
      ad_creative_id: adCreativeId,
      campaign_id: creative.campaign_id || creative.ad_campaign_id,
      type: "click",
      timestamp: new Date(),
      metadata: metadata || null,
    } as any);

    if (creative.campaign_id || creative.ad_campaign_id) {
      const campaignId = creative.campaign_id || creative.ad_campaign_id;
      const campaign = await this.retrieveAdCampaign(campaignId) as any;
      await this.updateAdCampaigns({
        id: campaignId,
        clicks: Number(campaign.clicks || 0) + 1,
      } as any);
    }

    return log;
  }

  /** Calculate click-through rate for a campaign */
  async calculateCTR(
    campaignId: string,
  ): Promise<{ impressions: number; clicks: number; ctr: number }> {
    const campaign = await this.retrieveAdCampaign(campaignId) as any;

    const impressions = Number(campaign.impressions || 0);
    const clicks = Number(campaign.clicks || 0);
    const ctr =
      impressions > 0 ? Math.round((clicks / impressions) * 10000) / 100 : 0;

    return { impressions, clicks, ctr };
  }

  /** Pause an active campaign */
  async pauseCampaign(campaignId: string): Promise<any> {
    const campaign = await this.retrieveAdCampaign(campaignId) as any;

    if (campaign.status !== "active") {
      throw new Error("Only active campaigns can be paused");
    }

    return await this.updateAdCampaigns({
      id: campaignId,
      status: "paused",
      paused_at: new Date(),
    } as any);
  }

  async approveCreative(creativeId: string, approvedBy: string): Promise<any> {
    if (!approvedBy) {
      throw new Error("Approver ID is required");
    }

    const creative = await this.retrieveAdCreative(creativeId) as any;
    if (creative.status === "approved") {
      throw new Error("Creative is already approved");
    }

    if (creative.status === "rejected") {
      throw new Error("Rejected creatives must be resubmitted before approval");
    }

    return await this.updateAdCreatives({
      id: creativeId,
      status: "approved",
      approved_by: approvedBy,
      approved_at: new Date(),
    } as any);
  }

  async rejectCreative(creativeId: string, reason: string): Promise<any> {
    if (!reason || reason.trim().length === 0) {
      throw new Error("Rejection reason is required");
    }

    const creative = await this.retrieveAdCreative(creativeId) as any;
    if (creative.status === "rejected") {
      throw new Error("Creative is already rejected");
    }

    return await this.updateAdCreatives({
      id: creativeId,
      status: "rejected",
      rejection_reason: reason,
      rejected_at: new Date(),
    } as any);
  }

  async getROIReport(campaignId: string): Promise<{
    campaignId: string;
    impressions: number;
    clicks: number;
    ctr: number;
    spend: number;
    budget: number;
    budgetUtilization: number;
    costPerClick: number;
    costPerImpression: number;
  }> {
    const campaign = await this.retrieveAdCampaign(campaignId) as any;

    const impressions = Number(campaign.impressions || 0);
    const clicks = Number(campaign.clicks || 0);
    const spend = Number(campaign.spent || 0);
    const budget = Number(campaign.budget || 0);
    const ctr =
      impressions > 0 ? Math.round((clicks / impressions) * 10000) / 100 : 0;
    const budgetUtilization =
      budget > 0 ? Math.round((spend / budget) * 10000) / 100 : 0;
    const costPerClick =
      clicks > 0 ? Math.round((spend / clicks) * 100) / 100 : 0;
    const costPerImpression =
      impressions > 0 ? Math.round((spend / impressions) * 10000) / 10000 : 0;

    return {
      campaignId,
      impressions,
      clicks,
      ctr,
      spend,
      budget,
      budgetUtilization,
      costPerClick,
      costPerImpression,
    };
  }

  async adjustBudget(campaignId: string, newBudget: number): Promise<any> {
    if (newBudget <= 0) {
      throw new Error("Budget must be greater than zero");
    }

    const campaign = await this.retrieveAdCampaign(campaignId) as any;

    if (campaign.status === "completed") {
      throw new Error("Cannot adjust budget for a completed campaign");
    }

    const spent = Number(campaign.spent || 0);
    if (newBudget < spent) {
      throw new Error(
        `New budget cannot be less than already spent amount ($${spent})`,
      );
    }

    return await this.updateAdCampaigns({
      id: campaignId,
      budget: newBudget,
      budget_updated_at: new Date(),
    } as any);
  }
}

export default AdvertisingModuleService;
