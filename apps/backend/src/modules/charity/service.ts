import { MedusaService } from "@medusajs/framework/utils"
import CharityOrg from "./models/charity-org"
import DonationCampaign from "./models/donation-campaign"
import Donation from "./models/donation"
import ImpactReport from "./models/impact-report"

class CharityModuleService extends MedusaService({
  CharityOrg,
  DonationCampaign,
  Donation,
  ImpactReport,
}) {
  /** Process a donation to a campaign */
  async processDonation(campaignId: string, donorId: string, amount: number, metadata?: Record<string, unknown>): Promise<any> {
    if (amount <= 0) {
      throw new Error("Donation amount must be greater than zero")
    }

    const campaign = await this.retrieveDonationCampaign(campaignId)

    if ((campaign as any).status !== "active") {
      throw new Error("Campaign is not accepting donations")
    }

    if ((campaign as any).end_date && new Date((campaign as any).end_date) < new Date()) {
      throw new Error("Campaign has ended")
    }

    const donation = await (this as any).createDonations({
      campaign_id: campaignId,
      donor_id: donorId,
      amount,
      status: "completed",
      donated_at: new Date(),
      metadata: metadata || null,
    })

    const currentRaised = Number((campaign as any).raised_amount || 0)
    await (this as any).updateDonationCampaigns({
      id: campaignId,
      raised_amount: currentRaised + amount,
      donor_count: Number((campaign as any).donor_count || 0) + 1,
    })

    return donation
  }

  /** Get campaign progress including percentage funded */
  async getCampaignProgress(campaignId: string): Promise<{
    raised: number
    goal: number
    percentage: number
    donorCount: number
    daysRemaining: number | null
  }> {
    const campaign = await this.retrieveDonationCampaign(campaignId) as any

    const raised = Number(campaign.raised_amount || 0)
    const goal = Number(campaign.goal_amount || 0)
    const percentage = goal > 0 ? Math.min((raised / goal) * 100, 100) : 0
    const donorCount = Number(campaign.donor_count || 0)

    let daysRemaining: number | null = null
    if (campaign.end_date) {
      const diff = new Date(campaign.end_date).getTime() - new Date().getTime()
      daysRemaining = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
    }

    return { raised, goal, percentage: Math.round(percentage * 100) / 100, donorCount, daysRemaining }
  }

  /** Generate an impact report for a campaign */
  async generateImpactReport(campaignId: string): Promise<any> {
    const campaign = await this.retrieveDonationCampaign(campaignId) as any
    const progress = await this.getCampaignProgress(campaignId)

    const donations = await this.listDonations({ campaign_id: campaignId }) as any
    const donationList = Array.isArray(donations) ? donations : [donations].filter(Boolean)

    const totalAmount = donationList.reduce((sum: number, d: any) => sum + Number(d.amount || 0), 0)
    const avgDonation = donationList.length > 0 ? totalAmount / donationList.length : 0

    const report = await (this as any).createImpactReports({
      campaign_id: campaignId,
      title: `Impact Report - ${campaign.title || campaign.id}`,
      total_raised: totalAmount,
      donor_count: donationList.length,
      average_donation: Math.round(avgDonation * 100) / 100,
      goal_percentage: progress.percentage,
      generated_at: new Date(),
      status: "draft",
    })

    return report
  }

  async createCampaign(data: {
    name: string
    description: string
    goalAmount: number
    startDate: Date
    endDate: Date
    organizationId: string
  }): Promise<any> {
    if (!data.name || !data.description) {
      throw new Error("Campaign name and description are required")
    }

    if (data.goalAmount <= 0) {
      throw new Error("Goal amount must be greater than zero")
    }

    if (new Date(data.endDate) <= new Date(data.startDate)) {
      throw new Error("End date must be after start date")
    }

    const org = await this.retrieveCharityOrg(data.organizationId) as any
    if (org.status !== "active" && org.status !== "verified") {
      throw new Error("Organization must be active or verified to create campaigns")
    }

    const campaign = await (this as any).createDonationCampaigns({
      charity_org_id: data.organizationId,
      title: data.name,
      description: data.description,
      goal_amount: data.goalAmount,
      raised_amount: 0,
      donor_count: 0,
      start_date: data.startDate,
      end_date: data.endDate,
      status: "active",
      created_at: new Date(),
    })

    return campaign
  }

  async issueTaxReceipt(donationId: string): Promise<{
    receiptNumber: string
    donationId: string
    donorId: string
    amount: number
    campaignName: string
    organizationName: string
    donatedAt: Date
    issuedAt: Date
  }> {
    const donation = await this.retrieveDonation(donationId) as any

    if (donation.status !== "completed") {
      throw new Error("Tax receipts can only be issued for completed donations")
    }

    const campaign = await this.retrieveDonationCampaign(donation.campaign_id) as any
    const org = await this.retrieveCharityOrg(campaign.charity_org_id) as any

    const receiptNumber = `TR-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`

    return {
      receiptNumber,
      donationId,
      donorId: donation.donor_id,
      amount: Number(donation.amount),
      campaignName: campaign.title || campaign.name,
      organizationName: org.name,
      donatedAt: donation.donated_at,
      issuedAt: new Date(),
    }
  }
  async calculateTaxDeduction(donationId: string, countryCode: string = "US"): Promise<{
    donationId: string
    donationAmount: number
    countryCode: string
    deductiblePercentage: number
    deductibleAmount: number
    maxDeductible: number | null
  }> {
    const donation = await this.retrieveDonation(donationId) as any

    if (donation.status !== "completed") {
      throw new Error("Tax deduction can only be calculated for completed donations")
    }

    const donationAmount = Number(donation.amount)

    const countryRules: Record<string, { percentage: number; maxDeductible: number | null }> = {
      US: { percentage: 60, maxDeductible: null },
      UK: { percentage: 100, maxDeductible: null },
      CA: { percentage: 75, maxDeductible: null },
      AU: { percentage: 100, maxDeductible: null },
      DE: { percentage: 20, maxDeductible: null },
      FR: { percentage: 66, maxDeductible: 20000 },
      AE: { percentage: 10, maxDeductible: null },
      SA: { percentage: 0, maxDeductible: null },
    }

    const rules = countryRules[countryCode.toUpperCase()] || { percentage: 0, maxDeductible: null }
    let deductibleAmount = Math.round((donationAmount * rules.percentage / 100) * 100) / 100

    if (rules.maxDeductible !== null) {
      deductibleAmount = Math.min(deductibleAmount, rules.maxDeductible)
    }

    return {
      donationId,
      donationAmount,
      countryCode: countryCode.toUpperCase(),
      deductiblePercentage: rules.percentage,
      deductibleAmount,
      maxDeductible: rules.maxDeductible,
    }
  }
}

export default CharityModuleService
