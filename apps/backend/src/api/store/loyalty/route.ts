import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "zod"
import { handleApiError } from "../../../lib/api-error-handler"

const SEED_PROGRAMS = [
  {
    id: "loyalty-prog-1",
    name: "Rewards Plus",
    description: "Earn points on every purchase and unlock exclusive member benefits.",
    points_per_dollar: 1,
    tier: "Bronze",
    thumbnail: "/seed-images/loyalty/1563013544-824ae1b704d3.jpg",
  },
  {
    id: "loyalty-prog-2",
    name: "VIP Rewards",
    description: "Premium loyalty program with accelerated earning and priority perks.",
    points_per_dollar: 2,
    tier: "Silver",
    thumbnail: "/seed-images/loyalty/1612404730960-5c71577fca11.jpg",
  },
  {
    id: "loyalty-prog-3",
    name: "Elite Circle",
    description: "Our top-tier program for frequent shoppers with the best rewards.",
    points_per_dollar: 3,
    tier: "Gold",
    thumbnail: "/seed-images/loyalty/1610375461246-83df859d849d.jpg",
  },
  {
    id: "loyalty-prog-4",
    name: "Cashback Stars",
    description: "Simple cashback rewards — earn store credit on every order.",
    points_per_dollar: 1.5,
    tier: "Bronze",
    thumbnail: "/seed-images/loyalty/1579547945413-497e1b99dac0.jpg",
  },
  {
    id: "loyalty-prog-5",
    name: "Community Rewards",
    description: "Support local causes while earning points on your purchases.",
    points_per_dollar: 1,
    tier: "Bronze",
    thumbnail: "/seed-images/loyalty/1563013544-824ae1b704d3.jpg",
  },
]

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
      programs: SEED_PROGRAMS,
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
          { name: "Bronze", min_points: 0, perks: ["1x points earning", "Member-only deals"], thumbnail: "/seed-images/loyalty/1563013544-824ae1b704d3.jpg" },
          { name: "Silver", min_points: 500, perks: ["1.5x points earning", "Free shipping on orders over $50"], thumbnail: "/seed-images/loyalty/1612404730960-5c71577fca11.jpg" },
          { name: "Gold", min_points: 2000, perks: ["2x points earning", "Free shipping on all orders", "Early access to sales"], thumbnail: "/seed-images/loyalty/1610375461246-83df859d849d.jpg" },
          { name: "Platinum", min_points: 5000, perks: ["3x points earning", "Free shipping", "Priority support", "Exclusive events"], thumbnail: "/seed-images/loyalty/1579547945413-497e1b99dac0.jpg" },
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
