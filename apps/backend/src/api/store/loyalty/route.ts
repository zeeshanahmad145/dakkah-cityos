import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "zod"
import { handleApiError } from "../../../lib/api-error-handler"

const enrollLoyaltySchema = z.object({
  program_id: z.string().min(1),
  tenant_id: z.string().min(1),
})

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const customerId = req.auth_context?.actor_id

  if (!customerId) {
    return res.json({
      enrolled: false,
      account: null,
      program: null,
      recent_transactions: [],
      public_info: {
        title: "Loyalty Rewards Program",
        description: "Earn points on every purchase and redeem them for discounts, free products, and exclusive perks.",
        benefits: [
          "Earn 1 point per dollar spent",
          "Redeem points for discounts on future purchases",
          "Exclusive member-only deals and early access",
          "Birthday rewards and special bonuses",
        ],
        tiers: [
          { name: "Bronze", min_points: 0, perks: ["1x points earning", "Member-only deals"], thumbnail: "https://images.unsplash.com/photo-1553729459-afe8f2e2ed65?w=800&h=600&fit=crop" },
          { name: "Silver", min_points: 500, perks: ["1.5x points earning", "Free shipping on orders over $50"], thumbnail: "https://images.unsplash.com/photo-1612404730960-5c71577fca11?w=800&h=600&fit=crop" },
          { name: "Gold", min_points: 2000, perks: ["2x points earning", "Free shipping on all orders", "Early access to sales"], thumbnail: "https://images.unsplash.com/photo-1610375461246-83df859d849d?w=800&h=600&fit=crop" },
          { name: "Platinum", min_points: 5000, perks: ["3x points earning", "Free shipping", "Priority support", "Exclusive events"], thumbnail: "https://images.unsplash.com/photo-1579547945413-497e1b99dac0?w=800&h=600&fit=crop" },
        ],
      },
    })
  }

  const { tenant_id } = req.query as Record<string, string | undefined>

  try {
    const loyaltyService = req.scope.resolve("loyalty") as any

    const accounts = await loyaltyService.listLoyaltyAccounts({
      customer_id: customerId,
      ...(tenant_id ? { tenant_id } : {}),
    })

    const accountList = Array.isArray(accounts) ? accounts : [accounts].filter(Boolean)

    if (accountList.length === 0) {
      return res.json({
        enrolled: false,
        account: null,
      })
    }

    const account = accountList[0]
    const balance = await loyaltyService.getBalance(account.id)

    let program = null
    try {
      program = await loyaltyService.retrieveLoyaltyProgram(account.program_id)
    } catch {
    }

    const transactions = await loyaltyService.getTransactionHistory(account.id, {
      limit: 10,
      offset: 0,
    })

    res.json({
      enrolled: true,
      account: {
        id: account.id,
        ...balance,
      },
      program: program
        ? {
            id: program.id,
            name: program.name,
            description: program.description,
            tiers: program.tiers,
          }
        : null,
      recent_transactions: Array.isArray(transactions) ? transactions : [],
    })
  } catch (error: any) {
    handleApiError(res, error, "STORE-LOYALTY")}
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const customerId = req.auth_context?.actor_id

  if (!customerId) {
    return res.status(401).json({ message: "Authentication required" })
  }

  const parsed = enrollLoyaltySchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ message: "Validation failed", errors: parsed.error.issues })
  }

  const { program_id, tenant_id } = parsed.data

  try {
    const loyaltyService = req.scope.resolve("loyalty") as any

    const account = await loyaltyService.getOrCreateAccount(program_id, customerId, tenant_id)

    res.status(201).json({
      success: true,
      account: {
        id: account.id,
        points_balance: Number(account.points_balance),
        lifetime_points: Number(account.lifetime_points),
        tier: account.tier,
        status: account.status,
      },
    })
  } catch (error: any) {
    handleApiError(res, error, "STORE-LOYALTY")}
}
