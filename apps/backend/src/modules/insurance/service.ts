// @ts-nocheck
import { MedusaService } from "@medusajs/framework/utils"
import InsurancePolicy from "./models/insurance-policy"
import InsuranceClaim from "./models/insurance-claim"

class InsuranceModuleService extends MedusaService({
  InsurancePolicy,
  InsuranceClaim,
}) {
  async createPolicy(data: {
    customerId: string
    productId: string
    planType: string
    coverageAmount: number
    premium: number
    startDate: Date
    metadata?: Record<string, unknown>
  }): Promise<any> {
    if (data.coverageAmount <= 0) {
      throw new Error("Coverage amount must be greater than zero")
    }
    if (data.premium <= 0) {
      throw new Error("Premium must be greater than zero")
    }

    const endDate = new Date(data.startDate)
    endDate.setFullYear(endDate.getFullYear() + 1)

    const policy = await (this as any).createInsPolicys({
      customer_id: data.customerId,
      product_id: data.productId,
      plan_type: data.planType,
      coverage_amount: data.coverageAmount,
      premium: data.premium,
      start_date: data.startDate,
      end_date: endDate,
      status: "active",
      policy_number: `POL-${Date.now().toString(36).toUpperCase()}`,
    })

    return policy
  }

  async fileInsuranceClaim(policyId: string, description: string, claimAmount: number): Promise<any> {
    if (!description || !description.trim()) {
      throw new Error("Claim description is required")
    }
    if (claimAmount <= 0) {
      throw new Error("Claim amount must be greater than zero")
    }

    const policy = await this.retrieveInsPolicy(policyId)

    if (policy.status !== "active") {
      throw new Error("Policy is not active")
    }

    if (claimAmount > Number(policy.coverage_amount)) {
      throw new Error("Claim amount exceeds coverage limit")
    }

    const claim = await (this as any).createInsClaims({
      policy_id: policyId,
      description: description.trim(),
      claim_amount: claimAmount,
      status: "pending",
      claim_number: `CLM-${Date.now().toString(36).toUpperCase()}`,
      filed_at: new Date(),
    })

    return claim
  }

  async processInsuranceClaim(claimId: string, decision: "approved" | "rejected", notes?: string): Promise<any> {
    const claim = await this.retrieveInsClaim(claimId)

    if (claim.status !== "pending" && claim.status !== "under_review") {
      throw new Error("Claim is not in a reviewable state")
    }

    const updated = await (this as any).updateInsClaims({
      id: claimId,
      status: decision,
      decision_notes: notes || null,
      decided_at: new Date(),
      payout_amount: decision === "approved" ? claim.claim_amount : 0,
    })

    return updated
  }

  async cancelPolicy(policyId: string, reason?: string): Promise<any> {
    const policy = await this.retrieveInsPolicy(policyId)

    if (policy.status === "cancelled") {
      throw new Error("Policy is already cancelled")
    }

    const updated = await (this as any).updateInsPolicys({
      id: policyId,
      status: "cancelled",
      cancellation_reason: reason || null,
      cancelled_at: new Date(),
    })

    return updated
  }

  async calculatePremium(policyData: {
    coverageType: string
    coverageAmount: number
    durationMonths: number
    riskFactors?: Record<string, any>
  }): Promise<{ basePremium: number; riskAdjustment: number; totalPremium: number; monthlyPremium: number }> {
    if (policyData.coverageAmount <= 0) {
      throw new Error("Coverage amount must be greater than zero")
    }
    if (policyData.durationMonths <= 0) {
      throw new Error("Duration must be greater than zero")
    }

    const baseRates: Record<string, number> = {
      basic: 0.02,
      standard: 0.035,
      comprehensive: 0.05,
      premium: 0.07,
    }

    const baseRate = baseRates[policyData.coverageType] || 0.035
    const basePremium = policyData.coverageAmount * baseRate

    let riskMultiplier = 1.0
    if (policyData.riskFactors) {
      if (policyData.riskFactors.age && policyData.riskFactors.age > 60) riskMultiplier += 0.3
      if (policyData.riskFactors.age && policyData.riskFactors.age < 25) riskMultiplier += 0.2
      if (policyData.riskFactors.claimHistory && policyData.riskFactors.claimHistory > 0) {
        riskMultiplier += policyData.riskFactors.claimHistory * 0.1
      }
      if (policyData.riskFactors.highRiskArea) riskMultiplier += 0.25
    }

    const riskAdjustment = Math.round((basePremium * (riskMultiplier - 1)) * 100) / 100
    const totalPremium = Math.round(basePremium * riskMultiplier * 100) / 100
    const monthlyPremium = Math.round((totalPremium / policyData.durationMonths) * 100) / 100

    return { basePremium: Math.round(basePremium * 100) / 100, riskAdjustment, totalPremium, monthlyPremium }
  }

  async processClaimAdjudication(claimId: string): Promise<{
    claimId: string
    decision: string
    reason: string
    approvedAmount: number
    deductible: number
  }> {
    const claim = await this.retrieveInsClaim(claimId) as any

    if (claim.status !== "pending" && claim.status !== "under_review") {
      throw new Error("Claim is not in a reviewable state")
    }

    const policy = await this.retrieveInsPolicy(claim.policy_id) as any

    if (policy.status !== "active") {
      await (this as any).updateInsClaims({ id: claimId, status: "rejected", decision_notes: "Policy is not active", decided_at: new Date(), payout_amount: 0 })
      return { claimId, decision: "denied", reason: "Policy is not active", approvedAmount: 0, deductible: 0 }
    }

    const now = new Date()
    if (new Date(policy.end_date) < now) {
      await (this as any).updateInsClaims({ id: claimId, status: "rejected", decision_notes: "Policy has expired", decided_at: new Date(), payout_amount: 0 })
      return { claimId, decision: "denied", reason: "Policy has expired", approvedAmount: 0, deductible: 0 }
    }

    const claimAmount = Number(claim.claim_amount)
    const coverageAmount = Number(policy.coverage_amount)

    const claims = await this.listInsClaims({ policy_id: policy.id }) as any
    const claimList = Array.isArray(claims) ? claims : [claims].filter(Boolean)
    const totalPaidOut = claimList
      .filter((c: any) => c.status === "approved" && c.id !== claimId)
      .reduce((sum: number, c: any) => sum + Number(c.payout_amount || 0), 0)

    const remainingCoverage = coverageAmount - totalPaidOut
    if (claimAmount > remainingCoverage) {
      await (this as any).updateInsClaims({ id: claimId, status: "rejected", decision_notes: "Claim exceeds remaining coverage", decided_at: new Date(), payout_amount: 0 })
      return { claimId, decision: "denied", reason: `Claim amount ${claimAmount} exceeds remaining coverage ${remainingCoverage}`, approvedAmount: 0, deductible: 0 }
    }

    const deductible = Math.round(coverageAmount * 0.05 * 100) / 100
    const approvedAmount = Math.max(0, Math.round((claimAmount - deductible) * 100) / 100)

    await (this as any).updateInsClaims({ id: claimId, status: "approved", decision_notes: "Claim approved after adjudication", decided_at: new Date(), payout_amount: approvedAmount })

    return { claimId, decision: "approved", reason: "Claim approved after adjudication", approvedAmount, deductible }
  }

  async renewPolicy(policyId: string): Promise<any> {
    const policy = await this.retrieveInsPolicy(policyId) as any
    const now = new Date()
    const endDate = new Date(policy.end_date)

    if (policy.status === "cancelled") {
      throw new Error("Cannot renew a cancelled policy")
    }

    if (endDate > now) {
      const daysRemaining = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      if (daysRemaining > 30) {
        throw new Error("Policy cannot be renewed more than 30 days before expiry")
      }
    }

    const basePremium = Number(policy.premium)
    const loyaltyDiscount = 0.05
    const newPremium = Math.round(basePremium * (1 - loyaltyDiscount) * 100) / 100

    const newStartDate = endDate > now ? endDate : now
    const newEndDate = new Date(newStartDate)
    newEndDate.setFullYear(newEndDate.getFullYear() + 1)

    const renewedPolicy = await (this as any).createInsPolicys({
      customer_id: policy.customer_id,
      product_id: policy.product_id,
      plan_type: policy.plan_type,
      coverage_amount: policy.coverage_amount,
      premium: newPremium,
      start_date: newStartDate,
      end_date: newEndDate,
      status: "active",
      policy_number: `POL-${Date.now().toString(36).toUpperCase()}`,
      previous_policy_id: policyId,
    })

    if (policy.status === "active") {
      await (this as any).updateInsPolicys({ id: policyId, status: "renewed" })
    }

    return { renewedPolicy, previousPolicyId: policyId, loyaltyDiscount: `${loyaltyDiscount * 100}%`, newPremium }
  }

  async getPolicyDetails(policyId: string): Promise<any> {
    const policy = await this.retrieveInsPolicy(policyId)
    const claims = await this.listInsClaims({ policy_id: policyId })
    const claimList = Array.isArray(claims) ? claims : [claims].filter(Boolean)

    const now = new Date()
    const endDate = new Date(policy.end_date)
    const isExpired = endDate < now

    return {
      ...policy,
      claims: claimList,
      isExpired,
      totalClaimed: claimList.reduce((sum: number, c: any) => sum + Number(c.claim_amount || 0), 0),
      remainingCoverage: Number(policy.coverage_amount) - claimList.reduce((sum: number, c: any) => sum + Number(c.payout_amount || 0), 0),
    }
  }
}

export default InsuranceModuleService
