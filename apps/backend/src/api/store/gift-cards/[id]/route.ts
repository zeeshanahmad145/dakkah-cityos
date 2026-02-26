import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

const SEED_GIFT_CARDS = [
  { id: "gc-1", name: "Birthday Celebration", theme: "birthday", thumbnail: "/seed-images/gift-cards%2F1558636508-e0db3814bd1d.jpg", denominations: [25, 50, 100, 200], message_preview: "Wishing you a wonderful birthday filled with joy!", description: "Colorful birthday-themed gift card with balloons and confetti design", remaining_value: 100, is_active: true },
  { id: "gc-2", name: "Wedding Wishes", theme: "wedding", thumbnail: "/seed-images/gift-cards%2F1519741497674-611481863552.jpg", denominations: [50, 100, 250, 500], message_preview: "Congratulations on your special day!", description: "Elegant wedding gift card with floral accents", remaining_value: 250, is_active: true },
  { id: "gc-3", name: "Holiday Cheer", theme: "holiday", thumbnail: "/seed-images/gift-cards%2F1559056199-641a0ac8b55e.jpg", denominations: [25, 50, 100], message_preview: "Happy Holidays! Enjoy this gift from the heart.", description: "Festive holiday design with snowflakes and warm colors", remaining_value: 50, is_active: true },
  { id: "gc-4", name: "Thank You", theme: "thank_you", thumbnail: "/seed-images/gift-cards%2F1606293926075-69a00dbfde81.jpg", denominations: [10, 25, 50, 100], message_preview: "Thank you for being amazing!", description: "Heartfelt thank you card with elegant typography", remaining_value: 25, is_active: true },
  { id: "gc-5", name: "Graduation Achievement", theme: "graduate", thumbnail: "/seed-images/gift-cards%2F1602028915047-37269d1a73f7.jpg", denominations: [50, 100, 200, 500], message_preview: "Congratulations, Graduate! The future is yours!", description: "Graduation-themed card celebrating academic achievement", remaining_value: 200, is_active: true },
]

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const moduleService = req.scope.resolve("promotionExt") as any
    const { id } = req.params
    const item = await moduleService.retrieveGiftCardExt(id)
    if (!item) {
      const seedItem = SEED_GIFT_CARDS.find(i => i.id === id) || SEED_GIFT_CARDS[0]
      return res.json({ item: seedItem })
    }
    return res.json({ item })
  } catch (error: any) {
    const { id } = req.params
    const seedItem = SEED_GIFT_CARDS.find(i => i.id === id) || SEED_GIFT_CARDS[0]
    return res.json({ item: seedItem })
  }
}
