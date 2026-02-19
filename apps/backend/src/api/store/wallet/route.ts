import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "zod"
import { handleApiError } from "../../../lib/api-error-handler"

const walletTopUpSchema = z.object({
  amount: z.number().positive(),
  currency_code: z.string().optional(),
  tenant_id: z.string().min(1),
  payment_method: z.string().optional(),
})

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const customerId = req.auth_context?.actor_id

  if (!customerId) {
    return res.json({
      wallet: {
        gift_card_balance: 0,
        loyalty_points: 0,
        total_credits: 0,
        currency: "USD",
      },
      public_info: {
        title: "Digital Wallet",
        description: "Manage your store credits, gift cards, and loyalty points all in one place.",
        features: [
          "Store and manage gift card balances",
          "Track loyalty points across programs",
          "Apply credits at checkout instantly",
          "Top up your wallet for faster checkout",
        ],
        accepted_methods: ["Gift Cards", "Store Credits", "Loyalty Points", "Promotional Credits"],
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

    const promotionExt = req.scope.resolve("promotionExt") as any
    let giftCardBalance = 0

    try {
      const giftCards = await promotionExt.listGiftCardExts({
        recipient_email: customerId,
        is_active: true,
      })

      const gcList = Array.isArray(giftCards) ? giftCards : [giftCards].filter(Boolean)
      giftCardBalance = gcList.reduce((sum: number, gc: any) => {
        if (gc.expires_at && new Date(gc.expires_at) < new Date()) return sum
        return sum + Number(gc.remaining_value || 0)
      }, 0)
    } catch {
    }

    const loyaltyBalance = accountList.reduce(
      (sum: number, acc: any) => sum + Number(acc.points_balance || 0),
      0
    )

    res.json({
      wallet: {
        gift_card_balance: giftCardBalance,
        loyalty_points: loyaltyBalance,
        total_credits: giftCardBalance,
        currency: "USD",
      },
    })
  } catch (error: any) {
    handleApiError(res, error, "STORE-WALLET")}
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const customerId = req.auth_context?.actor_id

  if (!customerId) {
    return res.status(401).json({ message: "Authentication required" })
  }

  const parsed = walletTopUpSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ message: "Validation failed", errors: parsed.error.issues })
  }

  const { amount, currency_code = "usd", tenant_id, payment_method } = parsed.data

  try {
    const promotionExt = req.scope.resolve("promotionExt") as any

    const code = `WLT-${customerId.slice(-6)}-${Date.now().toString(36).toUpperCase()}`

    const giftCard = await (promotionExt as any).createGiftCardExts({
      tenant_id,
      code,
      initial_value: amount,
      remaining_value: amount,
      currency_code,
      recipient_email: customerId,
      sender_name: "Wallet Top-up",
      is_active: true,
      metadata: { type: "wallet_topup", payment_method: payment_method || "unknown" },
    })

    res.status(201).json({
      success: true,
      transaction: {
        id: giftCard.id,
        amount,
        currency_code,
        type: "top_up",
      },
    })
  } catch (error: any) {
    handleApiError(res, error, "STORE-WALLET")}
}

