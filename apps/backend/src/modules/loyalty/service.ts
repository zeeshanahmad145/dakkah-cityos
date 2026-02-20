// @ts-nocheck
import { MedusaService } from "@medusajs/framework/utils"
import LoyaltyProgram from "./models/loyalty-program"
import LoyaltyAccount from "./models/loyalty-account"
import PointTransaction from "./models/point-transaction"

class LoyaltyModuleService extends MedusaService({
  LoyaltyProgram,
  LoyaltyAccount,
  PointTransaction,
}) {
  async earnPoints(data: {
    accountId: string
    points: number
    referenceType?: string
    referenceId?: string
    description?: string
    expiresAt?: Date
    metadata?: Record<string, unknown>
  }) {
    const account = await this.retrieveLoyaltyAccount(data.accountId)

    if (account.status !== "active") {
      throw new Error("Loyalty account is not active")
    }

    const newBalance = Number(account.points_balance) + data.points
    const newLifetime = Number(account.lifetime_points) + data.points

    await (this as any).updateLoyaltyAccounts({
      id: data.accountId,
      points_balance: newBalance,
      lifetime_points: newLifetime,
    })

    const transaction = await (this as any).createPointTransactions({
      account_id: data.accountId,
      tenant_id: account.tenant_id,
      type: "earn",
      points: data.points,
      balance_after: newBalance,
      reference_type: data.referenceType || null,
      reference_id: data.referenceId || null,
      description: data.description || null,
      expires_at: data.expiresAt || null,
      metadata: data.metadata || null,
    })

    await this.calculateTier(data.accountId)

    return transaction
  }

  async redeemPoints(data: {
    accountId: string
    points: number
    referenceType?: string
    referenceId?: string
    description?: string
    metadata?: Record<string, unknown>
  }) {
    const account = await this.retrieveLoyaltyAccount(data.accountId)

    if (account.status !== "active") {
      throw new Error("Loyalty account is not active")
    }

    if (Number(account.points_balance) < data.points) {
      throw new Error("Insufficient points balance")
    }

    const newBalance = Number(account.points_balance) - data.points

    await (this as any).updateLoyaltyAccounts({
      id: data.accountId,
      points_balance: newBalance,
    })

    const transaction = await (this as any).createPointTransactions({
      account_id: data.accountId,
      tenant_id: account.tenant_id,
      type: "redeem",
      points: -data.points,
      balance_after: newBalance,
      reference_type: data.referenceType || null,
      reference_id: data.referenceId || null,
      description: data.description || null,
      metadata: data.metadata || null,
    })

    return transaction
  }

  async getBalance(accountId: string) {
    const account = await this.retrieveLoyaltyAccount(accountId)
    return {
      points_balance: Number(account.points_balance),
      lifetime_points: Number(account.lifetime_points),
      tier: account.tier,
      tier_expires_at: account.tier_expires_at,
      status: account.status,
    }
  }

  async getTransactionHistory(
    accountId: string,
    options?: { limit?: number; offset?: number; type?: string }
  ) {
    const filters: Record<string, any> = { account_id: accountId }
    if (options?.type) {
      filters.type = options.type
    }

    const transactions = await this.listPointTransactions(filters, {
      take: options?.limit || 20,
      skip: options?.offset || 0,
      order: { created_at: "DESC" },
    })

    return transactions
  }

  async calculateTier(accountId: string) {
    const account = await this.retrieveLoyaltyAccount(accountId)
    const program = await this.retrieveLoyaltyProgram(account.program_id)

    if (!program.tiers || !Array.isArray(program.tiers)) {
      return account.tier
    }

    const tiers = program.tiers as Array<{
      name: string
      min_points: number
      duration_days?: number
    }>

    const sortedTiers = [...tiers].sort((a, b) => b.min_points - a.min_points)
    const lifetimePoints = Number(account.lifetime_points)

    let newTier: string | null = null
    let tierExpiry: Date | null = null

    for (const tier of sortedTiers) {
      if (lifetimePoints >= tier.min_points) {
        newTier = tier.name
        if (tier.duration_days) {
          tierExpiry = new Date()
          tierExpiry.setDate(tierExpiry.getDate() + tier.duration_days)
        }
        break
      }
    }

    if (newTier !== account.tier) {
      await (this as any).updateLoyaltyAccounts({
        id: accountId,
        tier: newTier,
        tier_expires_at: tierExpiry,
      })
    }

    return newTier
  }

  async expirePoints(beforeDate: Date) {
    const transactions = await this.listPointTransactions({
      type: "earn",
    })

    const txList = Array.isArray(transactions) ? transactions : [transactions].filter(Boolean)
    const expired = []

    for (const tx of txList) {
      if (tx.expires_at && new Date(tx.expires_at) <= beforeDate) {
        const account = await this.retrieveLoyaltyAccount(tx.account_id)
        const pointsToExpire = Math.min(Number(tx.points), Number(account.points_balance))

        if (pointsToExpire > 0) {
          const newBalance = Number(account.points_balance) - pointsToExpire

          await (this as any).updateLoyaltyAccounts({
            id: tx.account_id,
            points_balance: newBalance,
          })

          const expireTx = await (this as any).createPointTransactions({
            account_id: tx.account_id,
            tenant_id: account.tenant_id,
            type: "expire",
            points: -pointsToExpire,
            balance_after: newBalance,
            reference_type: null,
            reference_id: tx.id,
            description: `Points expired from transaction ${tx.id}`,
          })

          expired.push(expireTx)
        }
      }
    }

    return expired
  }

  /** Calculate points earned for an order based on amount and program rules */
  async calculatePoints(programId: string, amount: number): Promise<number> {
    if (amount <= 0) {
      throw new Error("Amount must be greater than zero")
    }

    const program = await this.retrieveLoyaltyProgram(programId)
    const pointsPerUnit = Number((program as any).points_per_currency_unit || 1)
    const multiplier = Number((program as any).multiplier || 1)

    return Math.floor(amount * pointsPerUnit * multiplier)
  }

  async checkTierUpgrade(customerId: string): Promise<{
    currentTier: string | null
    newTier: string | null
    upgraded: boolean
    pointsInPeriod: number
  }> {
    const accounts = await this.listLoyaltyAccounts({ customer_id: customerId }) as any
    const accountList = Array.isArray(accounts) ? accounts : [accounts].filter(Boolean)

    if (accountList.length === 0) {
      throw new Error("No loyalty account found for this customer")
    }

    const account = accountList[0]
    const program = await this.retrieveLoyaltyProgram(account.program_id)

    const twelveMonthsAgo = new Date()
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12)

    const transactions = await this.listPointTransactions({ account_id: account.id, type: "earn" }) as any
    const txList = Array.isArray(transactions) ? transactions : [transactions].filter(Boolean)

    const pointsInPeriod = txList
      .filter((tx: any) => new Date(tx.created_at) >= twelveMonthsAgo)
      .reduce((sum: number, tx: any) => sum + Number(tx.points || 0), 0)

    const currentTier = account.tier

    if (!program.tiers || !Array.isArray(program.tiers)) {
      return { currentTier, newTier: currentTier, upgraded: false, pointsInPeriod }
    }

    const tiers = program.tiers as Array<{ name: string; min_points: number }>
    const sortedTiers = [...tiers].sort((a, b) => b.min_points - a.min_points)

    let newTier: string | null = null
    for (const tier of sortedTiers) {
      if (pointsInPeriod >= tier.min_points) {
        newTier = tier.name
        break
      }
    }

    const upgraded = newTier !== currentTier && newTier !== null
    if (upgraded) {
      await (this as any).updateLoyaltyAccounts({ id: account.id, tier: newTier })
    }

    return { currentTier, newTier, upgraded, pointsInPeriod }
  }

  async applyEarningMultiplier(customerId: string, basePoints: number, campaignId?: string): Promise<{
    basePoints: number
    multiplier: number
    totalPoints: number
    campaignId?: string
  }> {
    if (basePoints <= 0) {
      throw new Error("Base points must be greater than zero")
    }

    const accounts = await this.listLoyaltyAccounts({ customer_id: customerId }) as any
    const accountList = Array.isArray(accounts) ? accounts : [accounts].filter(Boolean)

    if (accountList.length === 0) {
      throw new Error("No loyalty account found for this customer")
    }

    const account = accountList[0]
    let multiplier = 1.0

    const tierMultipliers: Record<string, number> = {
      bronze: 1.0,
      silver: 1.25,
      gold: 1.5,
      platinum: 2.0,
      diamond: 3.0,
    }

    if (account.tier) {
      multiplier = tierMultipliers[account.tier.toLowerCase()] || 1.0
    }

    if (campaignId) {
      multiplier *= 2.0
    }

    const totalPoints = Math.floor(basePoints * multiplier)

    return { basePoints, multiplier, totalPoints, campaignId }
  }

  async processReferralBonus(referrerId: string, referredId: string): Promise<{
    referrerBonus: any
    referredBonus: any
    bonusPoints: number
  }> {
    const referrerAccounts = await this.listLoyaltyAccounts({ customer_id: referrerId }) as any
    const referrerList = Array.isArray(referrerAccounts) ? referrerAccounts : [referrerAccounts].filter(Boolean)

    const referredAccounts = await this.listLoyaltyAccounts({ customer_id: referredId }) as any
    const referredList = Array.isArray(referredAccounts) ? referredAccounts : [referredAccounts].filter(Boolean)

    if (referrerList.length === 0) {
      throw new Error("Referrer does not have a loyalty account")
    }
    if (referredList.length === 0) {
      throw new Error("Referred customer does not have a loyalty account")
    }

    const bonusPoints = 500

    const referrerBonus = await this.earnPoints({
      accountId: referrerList[0].id,
      points: bonusPoints,
      referenceType: "referral",
      referenceId: referredId,
      description: `Referral bonus for referring customer ${referredId}`,
    })

    const referredBonus = await this.earnPoints({
      accountId: referredList[0].id,
      points: Math.floor(bonusPoints / 2),
      referenceType: "referral",
      referenceId: referrerId,
      description: `Welcome bonus from referral by customer ${referrerId}`,
    })

    return { referrerBonus, referredBonus, bonusPoints }
  }

  async getOrCreateAccount(programId: string, customerId: string, tenantId: string) {
    const existing = await this.listLoyaltyAccounts({
      program_id: programId,
      customer_id: customerId,
    })

    const list = Array.isArray(existing) ? existing : [existing].filter(Boolean)
    if (list.length > 0) {
      return list[0]
    }

    return await (this as any).createLoyaltyAccounts({
      program_id: programId,
      customer_id: customerId,
      tenant_id: tenantId,
      points_balance: 0,
      lifetime_points: 0,
      status: "active",
    })
  }
}

export default LoyaltyModuleService
