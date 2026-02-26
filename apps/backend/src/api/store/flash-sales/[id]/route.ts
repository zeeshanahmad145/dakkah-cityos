import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

function getFlashSalesSeedData() {
  const now = Date.now()
  return [
    {
      id: "fs-1", name: "Wireless Noise-Cancelling Headphones", category: "electronics", thumbnail: "/seed-images/auctions%2F1505740420928-5e560c06d30e.jpg", original_price: 29999, sale_price: 14999, discount_percentage: 50, end_date: new Date(now + 3 * 60 * 60 * 1000).toISOString(), stock_remaining: 12, description: "Premium ANC headphones with 30hr battery life",
      reviews: [
        { author: "Mark T.", rating: 5, comment: "Incredible noise cancellation and the sound quality is pristine. Got them at half price during the flash sale!", created_at: "2025-04-10T14:00:00Z" },
        { author: "Jenny L.", rating: 4, comment: "Great headphones for the price. Battery life is as advertised. Comfortable for long listening sessions.", created_at: "2025-03-28T16:30:00Z" },
        { author: "Alex P.", rating: 5, comment: "Best deal I've ever gotten. These rival headphones that cost twice as much at full retail.", created_at: "2025-03-15T11:00:00Z" },
        { author: "Sophie R.", rating: 4, comment: "Sound quality is excellent. The ANC works well on flights. Slightly tight fit but breaks in over time.", created_at: "2025-02-20T09:45:00Z" },
        { author: "Daniel K.", rating: 5, comment: "Snagged these during the flash sale and couldn't be happier. Premium build quality and amazing bass.", created_at: "2025-02-05T13:15:00Z" },
      ],
    },
    {
      id: "fs-2", name: "Smart Fitness Watch Pro", category: "electronics", thumbnail: "/seed-images/auctions%2F1523275335684-37898b6baf30.jpg", original_price: 19999, sale_price: 9999, discount_percentage: 50, end_date: new Date(now + 5 * 60 * 60 * 1000).toISOString(), stock_remaining: 8, description: "Heart rate, GPS, and sleep tracking",
      reviews: [
        { author: "Chris W.", rating: 5, comment: "Accurate GPS tracking and the sleep analysis has helped me improve my rest. Amazing value at this price.", created_at: "2025-04-08T08:00:00Z" },
        { author: "Lisa M.", rating: 5, comment: "Love the heart rate monitoring during workouts. Battery lasts almost a week. Best fitness watch under $100.", created_at: "2025-03-25T10:30:00Z" },
        { author: "Tom H.", rating: 4, comment: "Great features for the sale price. The app integration is smooth. Screen could be a bit brighter outdoors.", created_at: "2025-03-12T15:00:00Z" },
        { author: "Rachel G.", rating: 4, comment: "Replaced my old fitness tracker with this. The sleep tracking is surprisingly detailed and accurate.", created_at: "2025-02-28T07:30:00Z" },
        { author: "James F.", rating: 5, comment: "Couldn't believe the 50% off deal. This watch has everything I need for marathon training.", created_at: "2025-02-14T12:00:00Z" },
      ],
    },
    {
      id: "fs-3", name: "Designer Leather Handbag", category: "fashion", thumbnail: "/seed-images/consignments%2F1548036328-c9fa89d128fa.jpg", original_price: 24999, sale_price: 12499, discount_percentage: 50, end_date: new Date(now + 2 * 60 * 60 * 1000).toISOString(), stock_remaining: 5, description: "Italian genuine leather, limited edition",
      reviews: [
        { author: "Victoria S.", rating: 5, comment: "The leather quality is exceptional. You can smell the genuine Italian craftsmanship. Worth every penny even at full price.", created_at: "2025-04-06T11:00:00Z" },
        { author: "Amanda C.", rating: 5, comment: "Bought this as a gift and she absolutely loves it. The stitching and hardware are top-notch.", created_at: "2025-03-22T14:30:00Z" },
        { author: "Patricia N.", rating: 4, comment: "Beautiful bag with great organization inside. The limited edition design gets compliments everywhere.", created_at: "2025-03-08T16:00:00Z" },
        { author: "Helen B.", rating: 5, comment: "I've been eyeing this bag for months. The flash sale made it affordable. Stunning craftsmanship.", created_at: "2025-02-20T13:00:00Z" },
        { author: "Grace T.", rating: 4, comment: "Elegant design and spacious interior. The leather is soft yet durable. A great investment piece.", created_at: "2025-02-01T10:15:00Z" },
      ],
    },
    {
      id: "fs-4", name: "Organic Skincare Bundle", category: "beauty", thumbnail: "/seed-images/bundles%2F1556228578-0d85b1a4d571.jpg", original_price: 8999, sale_price: 3599, discount_percentage: 60, end_date: new Date(now + 8 * 60 * 60 * 1000).toISOString(), stock_remaining: 23, description: "5-piece set with cleanser, toner, serum, moisturizer & mask",
      reviews: [
        { author: "Mia J.", rating: 5, comment: "My skin has never looked better! The serum is my favorite — it absorbs quickly and leaves skin glowing.", created_at: "2025-04-09T09:00:00Z" },
        { author: "Olivia D.", rating: 4, comment: "Love that everything is organic. The mask is incredibly hydrating. Great value at the sale price.", created_at: "2025-03-26T11:30:00Z" },
        { author: "Emma W.", rating: 5, comment: "Finally a skincare set that doesn't irritate my sensitive skin. All five products work beautifully together.", created_at: "2025-03-10T08:00:00Z" },
        { author: "Sophia L.", rating: 5, comment: "60% off was unbelievable. Bought two sets — one for me and one as a gift. The cleanser is fantastic.", created_at: "2025-02-22T14:00:00Z" },
        { author: "Ava R.", rating: 4, comment: "The toner and moisturizer are standouts. Pleasant natural scent. Would love a larger size option.", created_at: "2025-02-08T10:45:00Z" },
      ],
    },
    {
      id: "fs-5", name: "Premium Coffee Machine", category: "home", thumbnail: "/seed-images/flash-sales%2F1495474472287-4d71bcdd2085.jpg", original_price: 44999, sale_price: 22499, discount_percentage: 50, end_date: new Date(now + 1 * 60 * 60 * 1000).toISOString(), stock_remaining: 3, description: "Espresso, cappuccino & latte with built-in grinder",
      reviews: [
        { author: "Roberto M.", rating: 5, comment: "The built-in grinder makes all the difference. Fresh espresso every morning that rivals my local café.", created_at: "2025-04-11T07:00:00Z" },
        { author: "Karen S.", rating: 5, comment: "Saving so much money not buying lattes anymore. This machine pays for itself in a month. Beautiful design too.", created_at: "2025-03-29T08:30:00Z" },
        { author: "Steve P.", rating: 4, comment: "Excellent machine with easy-to-use controls. The cappuccino frother is impressive. Cleaning could be simpler.", created_at: "2025-03-14T09:00:00Z" },
        { author: "Linda A.", rating: 5, comment: "Got this at half price during the flash sale. Professional-quality coffee at home. My husband is obsessed.", created_at: "2025-02-26T07:45:00Z" },
        { author: "Paul E.", rating: 4, comment: "Solid build quality and consistent extraction. The grinder has multiple settings for different brew styles.", created_at: "2025-02-10T10:00:00Z" },
      ],
    },
  ]
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
    const { id } = req.params

    const { data: promos } = await query.graph({
      entity: "promotion",
      fields: [
        "id",
        "code",
        "is_automatic",
        "type",
        "status",
        "starts_at",
        "ends_at",
        "campaign_id",
        "application_method.type",
        "application_method.value",
        "application_method.target_type",
      ],
      filters: { id },
    })

    const item = Array.isArray(promos) ? promos[0] : promos
    if (!item) {
      const seed = getFlashSalesSeedData()
      const seedItem = seed.find(i => i.id === id) || seed[0]
      return res.json({ item: seedItem })
    }

    return res.json({ item })
  } catch (error: any) {
    const { id } = req.params
    const seed = getFlashSalesSeedData()
    const seedItem = seed.find(i => i.id === id) || seed[0]
    return res.json({ item: seedItem })
  }
}
