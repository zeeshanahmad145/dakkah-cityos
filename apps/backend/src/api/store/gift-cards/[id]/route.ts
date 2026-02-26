import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

const SEED_GIFT_CARDS = [
  {
    id: "gc-1", name: "Birthday Celebration", theme: "birthday", thumbnail: "/seed-images/gift-cards/1558636508-e0db3814bd1d.jpg", denominations: [25, 50, 100, 200], message_preview: "Wishing you a wonderful birthday filled with joy!", description: "Colorful birthday-themed gift card with balloons and confetti design", remaining_value: 100, is_active: true,
    reviews: [
      { author: "Jessica M.", rating: 5, comment: "Perfect birthday gift for my niece! She loved the colorful design and picked out exactly what she wanted.", created_at: "2025-04-10T12:00:00Z" },
      { author: "Andrew P.", rating: 5, comment: "Easy to purchase and send. The birthday theme was festive and my friend was thrilled to receive it.", created_at: "2025-03-28T15:30:00Z" },
      { author: "Hannah R.", rating: 4, comment: "Great option when you're not sure what to get someone. The denomination options are flexible enough.", created_at: "2025-03-12T09:00:00Z" },
      { author: "Tyler S.", rating: 5, comment: "Bought this last minute and it was delivered instantly. The design is cheerful and the recipient loved it.", created_at: "2025-02-20T14:00:00Z" },
      { author: "Karen W.", rating: 4, comment: "Nice selection of amounts. The birthday message was sweet. Would love more customization options.", created_at: "2025-02-05T11:15:00Z" },
    ],
  },
  {
    id: "gc-2", name: "Wedding Wishes", theme: "wedding", thumbnail: "/seed-images/gift-cards/1519741497674-611481863552.jpg", denominations: [50, 100, 250, 500], message_preview: "Congratulations on your special day!", description: "Elegant wedding gift card with floral accents", remaining_value: 250, is_active: true,
    reviews: [
      { author: "Stephanie B.", rating: 5, comment: "Such an elegant design for a wedding gift. The couple appreciated being able to choose their own gift.", created_at: "2025-04-08T10:00:00Z" },
      { author: "Michael C.", rating: 5, comment: "The floral design is beautiful and appropriate for a wedding. Higher denominations make it a generous gift.", created_at: "2025-03-25T13:00:00Z" },
      { author: "Natalie D.", rating: 4, comment: "Perfect for when couples already have everything. The wedding theme adds a personal touch.", created_at: "2025-03-10T16:30:00Z" },
      { author: "David L.", rating: 5, comment: "Gave this as a wedding gift and the newlyweds were delighted. Clean, sophisticated design.", created_at: "2025-02-22T11:00:00Z" },
      { author: "Emily F.", rating: 5, comment: "The $500 option is perfect for a wedding gift. Much better than guessing what they need for their new home.", created_at: "2025-02-08T09:30:00Z" },
    ],
  },
  {
    id: "gc-3", name: "Holiday Cheer", theme: "holiday", thumbnail: "/seed-images/gift-cards/1559056199-641a0ac8b55e.jpg", denominations: [25, 50, 100], message_preview: "Happy Holidays! Enjoy this gift from the heart.", description: "Festive holiday design with snowflakes and warm colors", remaining_value: 50, is_active: true,
    reviews: [
      { author: "Robert K.", rating: 5, comment: "Bought these for all my coworkers during the holidays. The festive design was perfect and everyone loved them.", created_at: "2025-04-05T14:00:00Z" },
      { author: "Linda M.", rating: 4, comment: "Great stocking stuffer idea. The snowflake design is beautiful. Wish there was a $10 denomination too.", created_at: "2025-03-20T10:00:00Z" },
      { author: "Chris H.", rating: 5, comment: "So much easier than shopping for individual gifts. The holiday theme makes it feel personal and thoughtful.", created_at: "2025-03-05T15:30:00Z" },
      { author: "Sarah N.", rating: 4, comment: "Warm holiday design that feels premium. Perfect for teachers, mail carriers, and neighbors.", created_at: "2025-02-18T08:00:00Z" },
      { author: "James B.", rating: 5, comment: "The warm colors and snowflake design really capture the holiday spirit. Recipients always appreciate the choice.", created_at: "2025-02-01T12:45:00Z" },
    ],
  },
  {
    id: "gc-4", name: "Thank You", theme: "thank_you", thumbnail: "/seed-images/gift-cards/1606293926075-69a00dbfde81.jpg", denominations: [10, 25, 50, 100], message_preview: "Thank you for being amazing!", description: "Heartfelt thank you card with elegant typography", remaining_value: 25, is_active: true,
    reviews: [
      { author: "Amanda T.", rating: 5, comment: "Sent this to my mentor as a thank you. The message and design perfectly conveyed my gratitude.", created_at: "2025-04-09T11:00:00Z" },
      { author: "Brian J.", rating: 5, comment: "Love the elegant typography. Used these to thank volunteers at our event. They were genuinely touched.", created_at: "2025-03-26T09:30:00Z" },
      { author: "Catherine R.", rating: 4, comment: "Simple, classy design. The $10 option is great for small tokens of appreciation. Fast digital delivery.", created_at: "2025-03-12T14:00:00Z" },
      { author: "Daniel W.", rating: 5, comment: "Perfect way to say thanks to my kids' teachers at the end of the school year. Professional and heartfelt.", created_at: "2025-02-25T10:15:00Z" },
      { author: "Eva G.", rating: 4, comment: "Clean design that works for any occasion. The range of denominations from $10-$100 covers every situation.", created_at: "2025-02-10T13:00:00Z" },
    ],
  },
  {
    id: "gc-5", name: "Graduation Achievement", theme: "graduate", thumbnail: "/seed-images/gift-cards/1602028915047-37269d1a73f7.jpg", denominations: [50, 100, 200, 500], message_preview: "Congratulations, Graduate! The future is yours!", description: "Graduation-themed card celebrating academic achievement", remaining_value: 200, is_active: true,
    reviews: [
      { author: "Patricia L.", rating: 5, comment: "Gave this to my daughter for her college graduation. She used it to buy things for her new apartment.", created_at: "2025-04-11T16:00:00Z" },
      { author: "George H.", rating: 5, comment: "The graduation theme is celebratory and the higher denomination options make it a meaningful gift.", created_at: "2025-03-30T12:00:00Z" },
      { author: "Maria S.", rating: 4, comment: "Great gift for graduates of any level. The message is encouraging and the design feels special.", created_at: "2025-03-15T10:30:00Z" },
      { author: "William T.", rating: 5, comment: "Much better than trying to guess what a graduate needs. Let them choose! Beautiful card design.", created_at: "2025-02-28T14:45:00Z" },
      { author: "Nancy K.", rating: 5, comment: "The $500 option was perfect for my son's MBA graduation. He appreciated the freedom to choose his own reward.", created_at: "2025-02-12T11:00:00Z" },
    ],
  },
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
