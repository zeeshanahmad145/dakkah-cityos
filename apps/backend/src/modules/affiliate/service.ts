import { MedusaService } from "@medusajs/framework/utils";
import Affiliate from "./models/affiliate";
import ReferralLink from "./models/referral-link";
import ClickTracking from "./models/click-tracking";
import AffiliateCommission from "./models/affiliate-commission";
import InfluencerCampaign from "./models/influencer-campaign";

class AffiliateModuleService extends MedusaService({
  Affiliate,
  ReferralLink,
  ClickTracking,
  AffiliateCommission,
  InfluencerCampaign,
}) {
  /**
   * Generate a unique referral code and link for an affiliate.
   */
  async generateReferralCode(affiliateId: string): Promise<any> {
    const affiliate = await this.retrieveAffiliate(affiliateId) as any;
    const code = `REF-${affiliateId.substring(0, 6).toUpperCase()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const link = await this.createReferralLinks({
      affiliate_id: affiliateId,
      code,
      status: "active",
      created_at: new Date(),
      click_count: 0,
      conversion_count: 0,
    } as any);
    return link;
  }

  /**
   * Track a referral conversion when an order is placed using a referral code.
   */
  async trackReferral(code: string, orderId: string): Promise<any> {
    const links = await this.listReferralLinks({ code }) as any;
    const linkList = Array.isArray(links) ? links : [links].filter(Boolean);
    if (linkList.length === 0) {
      throw new Error("Invalid referral code");
    }
    const link = linkList[0];
    await this.updateReferralLinks({
      id: link.id,
      conversion_count: (Number(link.conversion_count) || 0) + 1,
    } as any);
    const tracking = await this.createClickTrackings({
      referral_link_id: link.id,
      order_id: orderId,
      tracked_at: new Date(),
      type: "conversion",
    } as any);
    return tracking;
  }

  /**
   * Calculate total commission earned by an affiliate for a given period.
   */
  async calculateCommission(
    affiliateId: string,
    period: { start: Date; end: Date },
  ): Promise<{
    affiliateId: string;
    totalCommission: number;
    transactionCount: number;
  }> {
    const commissions = await this.listAffiliateCommissions({
      affiliate_id: affiliateId,
    }) as any;
    const list = Array.isArray(commissions)
      ? commissions
      : [commissions].filter(Boolean);
    const periodCommissions = list.filter((c: any) => {
      const date = new Date(c.created_at);
      return date >= period.start && date <= period.end;
    });
    const totalCommission = periodCommissions.reduce(
      (sum: number, c: any) => sum + Number(c.amount || 0),
      0,
    );
    return {
      affiliateId,
      totalCommission,
      transactionCount: periodCommissions.length,
    };
  }

  /**
   * Process commission payouts for all affiliates for a given period.
   */
  async processPayouts(period: { start: Date; end: Date }): Promise<any[]> {
    const affiliates = await this.listAffiliates({ status: "active" }) as any;
    const affiliateList = Array.isArray(affiliates)
      ? affiliates
      : [affiliates].filter(Boolean);
    const payouts: any[] = [];
    for (const affiliate of affiliateList) {
      const { totalCommission, transactionCount } =
        await this.calculateCommission(affiliate.id, period);
      if (totalCommission > 0) {
        payouts.push({
          affiliateId: affiliate.id,
          amount: totalCommission,
          transactions: transactionCount,
          processedAt: new Date(),
        });
      }
    }
    return payouts;
  }

  async registerAffiliate(data: {
    vendorId: string;
    name: string;
    commissionRate: number;
    paymentMethod: string;
  }): Promise<any> {
    if (!data.vendorId || !data.name) {
      throw new Error("Vendor ID and name are required");
    }
    if (data.commissionRate < 0 || data.commissionRate > 100) {
      throw new Error("Commission rate must be between 0 and 100");
    }
    const validPaymentMethods = ["bank_transfer", "paypal", "stripe", "crypto"];
    if (!validPaymentMethods.includes(data.paymentMethod)) {
      throw new Error(
        `Invalid payment method. Must be one of: ${validPaymentMethods.join(", ")}`,
      );
    }

    const existing = await this.listAffiliates({
      vendor_id: data.vendorId,
    }) as any;
    const existingList = Array.isArray(existing)
      ? existing
      : [existing].filter(Boolean);
    if (existingList.length > 0) {
      throw new Error("An affiliate already exists for this vendor");
    }

    const affiliate = await this.createAffiliates({
      vendor_id: data.vendorId,
      name: data.name,
      commission_rate: data.commissionRate,
      payment_method: data.paymentMethod,
      status: "active",
      total_earnings: 0,
      total_referrals: 0,
      created_at: new Date(),
    } as any);
    return affiliate;
  }

  async calculatePayout(
    affiliateId: string,
    periodStart: Date,
    periodEnd: Date,
  ): Promise<{
    affiliateId: string;
    pendingAmount: number;
    commissionCount: number;
    periodStart: Date;
    periodEnd: Date;
  }> {
    const affiliate = await this.retrieveAffiliate(affiliateId) as any;
    const commissions = await this.listAffiliateCommissions({
      affiliate_id: affiliateId,
    }) as any;
    const list = Array.isArray(commissions)
      ? commissions
      : [commissions].filter(Boolean);

    const pendingCommissions = list.filter((c: any) => {
      const date = new Date(c.created_at);
      return date >= periodStart && date <= periodEnd && c.status !== "paid";
    });

    const pendingAmount = pendingCommissions.reduce(
      (sum: number, c: any) => sum + Number(c.amount || 0),
      0,
    );

    return {
      affiliateId,
      pendingAmount: Math.round(pendingAmount * 100) / 100,
      commissionCount: pendingCommissions.length,
      periodStart,
      periodEnd,
    };
  }

  async getAffiliatePerformance(affiliateId: string): Promise<{
    affiliateId: string;
    totalReferrals: number;
    totalConversions: number;
    totalEarnings: number;
    conversionRate: number;
  }> {
    const affiliate = await this.retrieveAffiliate(affiliateId) as any;
    const links = await this.listReferralLinks({
      affiliate_id: affiliateId,
    }) as any;
    const linkList = Array.isArray(links) ? links : [links].filter(Boolean);

    const totalReferrals = linkList.reduce(
      (sum: number, l: any) => sum + Number(l.click_count || 0),
      0,
    );
    const totalConversions = linkList.reduce(
      (sum: number, l: any) => sum + Number(l.conversion_count || 0),
      0,
    );

    const commissions = await this.listAffiliateCommissions({
      affiliate_id: affiliateId,
    }) as any;
    const commList = Array.isArray(commissions)
      ? commissions
      : [commissions].filter(Boolean);
    const totalEarnings = commList.reduce(
      (sum: number, c: any) => sum + Number(c.amount || 0),
      0,
    );

    const conversionRate =
      totalReferrals > 0
        ? Math.round((totalConversions / totalReferrals) * 10000) / 100
        : 0;

    return {
      affiliateId,
      totalReferrals,
      totalConversions,
      totalEarnings: Math.round(totalEarnings * 100) / 100,
      conversionRate,
    };
  }
}

export default AffiliateModuleService;
