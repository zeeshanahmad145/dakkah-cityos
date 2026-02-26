import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "zod"
import { handleApiError } from "../../../lib/api-error-handler"

const SEED_GIFT_CARDS = [
  { id: "gc-1", name: "Birthday Celebration", theme: "birthday", thumbnail: "/seed-images/gift-cards%2F1558636508-e0db3814bd1d.jpg", denominations: [25, 50, 100, 200], message_preview: "Wishing you a wonderful birthday filled with joy!", description: "Colorful birthday-themed gift card with balloons and confetti design", remaining_value: 100, is_active: true },
  { id: "gc-2", name: "Wedding Wishes", theme: "wedding", thumbnail: "/seed-images/gift-cards%2F1519741497674-611481863552.jpg", denominations: [50, 100, 250, 500], message_preview: "Congratulations on your special day!", description: "Elegant wedding gift card with floral accents", remaining_value: 250, is_active: true },
  { id: "gc-3", name: "Holiday Cheer", theme: "holiday", thumbnail: "/seed-images/gift-cards%2F1559056199-641a0ac8b55e.jpg", denominations: [25, 50, 100], message_preview: "Happy Holidays! Enjoy this gift from the heart.", description: "Festive holiday design with snowflakes and warm colors", remaining_value: 50, is_active: true },
  { id: "gc-4", name: "Thank You", theme: "thank_you", thumbnail: "/seed-images/gift-cards%2F1606293926075-69a00dbfde81.jpg", denominations: [10, 25, 50, 100], message_preview: "Thank you for being amazing!", description: "Heartfelt thank you card with elegant typography", remaining_value: 25, is_active: true },
  { id: "gc-5", name: "Graduation Achievement", theme: "graduate", thumbnail: "/seed-images/gift-cards%2F1602028915047-37269d1a73f7.jpg", denominations: [50, 100, 200, 500], message_preview: "Congratulations, Graduate! The future is yours!", description: "Graduation-themed card celebrating academic achievement", remaining_value: 200, is_active: true },
]

const giftCardPostSchema = z.object({
  code: z.string().optional(),
  amount: z.number().optional(),
  cart_id: z.string().optional(),
  recipient_email: z.string().optional(),
  recipient_name: z.string().optional(),
  sender_name: z.string().optional(),
  sender_email: z.string().optional(),
  message: z.string().optional(),
  tenant_id: z.string().optional(),
})

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const { limit = "20", offset = "0", tenant_id, code } = req.query as Record<string, string | undefined>

  try {
    const moduleService = req.scope.resolve("promotionExt") as any

    const filters: Record<string, any> = { is_active: true }
    if (tenant_id) filters.tenant_id = tenant_id
    if (code) filters.code = code

    const items = await moduleService.listGiftCardExts(filters, {
      skip: Number(offset),
      take: Number(limit),
      order: { created_at: "DESC" },
    })

    const giftCards = (Array.isArray(items) ? items : [items].filter(Boolean)).filter((gc: any) => {
      if (gc.expires_at && new Date(gc.expires_at) < new Date()) return false
      return Number(gc.remaining_value) > 0
    })

    const result = giftCards.length > 0 ? giftCards : SEED_GIFT_CARDS
    res.json({
      items: result,
      gift_cards: result,
      count: result.length,
      limit: Number(limit),
      offset: Number(offset),
    })
  } catch (error: any) {
    return res.json({ items: SEED_GIFT_CARDS, gift_cards: SEED_GIFT_CARDS, count: SEED_GIFT_CARDS.length, limit: 20, offset: 0 })
  }
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const customerId = (req as any).auth_context?.actor_id
    if (!customerId) {
      return res.status(401).json({ message: "Authentication required" })
    }

    const parsed = giftCardPostSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ message: "Validation failed", errors: parsed.error.issues })
    }

    const { code, amount, cart_id, recipient_email, recipient_name, sender_name, sender_email, message, tenant_id } = parsed.data

    const moduleService = req.scope.resolve("promotionExt") as any

    if (code) {
      const cards = await moduleService.listGiftCardExts({ code, is_active: true })
      const cardList = Array.isArray(cards) ? cards : [cards].filter(Boolean)

      if (cardList.length === 0) {
        return res.status(404).json({ message: "Gift card not found or inactive" })
      }

      const giftCard = cardList[0]

      if (giftCard.expires_at && new Date(giftCard.expires_at) < new Date()) {
        return res.status(400).json({ message: "Gift card has expired" })
      }

      if (Number(giftCard.remaining_value) <= 0) {
        return res.status(400).json({ message: "Gift card has no remaining balance" })
      }

      const redeemAmount = amount || Number(giftCard.remaining_value)
      if (redeemAmount > Number(giftCard.remaining_value)) {
        return res.status(400).json({ message: "Insufficient gift card balance" })
      }

      const newBalance = Number(giftCard.remaining_value) - redeemAmount
      await (moduleService as any).updateGiftCardExts({
        id: giftCard.id,
        remaining_value: newBalance,
        is_active: newBalance > 0,
      })

      return res.json({
        success: true,
        redeemed_amount: redeemAmount,
        remaining_value: newBalance,
        gift_card_id: giftCard.id,
      })
    }

    if (recipient_email && amount && tenant_id) {
      const generatedCode = `GC-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`

      const giftCard = await (moduleService as any).createGiftCardExts({
        tenant_id,
        code: generatedCode,
        initial_value: amount,
        remaining_value: amount,
        currency_code: "usd",
        sender_name: sender_name || null,
        sender_email: sender_email || null,
        recipient_name: recipient_name || null,
        recipient_email,
        message: message || null,
        is_active: true,
      })

      return res.status(201).json({ gift_card: giftCard })
    }

    return res.status(400).json({ message: "Provide a code to redeem, or recipient_email, amount, and tenant_id to purchase" })
  } catch (error: any) {
    handleApiError(res, error, "STORE-GIFT-CARDS")}
}
