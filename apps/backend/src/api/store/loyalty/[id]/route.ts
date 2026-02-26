import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { handleApiError } from "../../../../lib/api-error-handler"

const SEED_DATA = [
  {
    id: "loyalty-bronze",
    name: "Bronze",
    type: "tier",
    min_points: 0,
    perks: ["1x points earning", "Member-only deals"],
    thumbnail: "/seed-images/loyalty%2F1563013544-824ae1b704d3.jpg",
    description: "Start earning rewards with every purchase. Enjoy exclusive member-only deals and promotions.",
    tiers: [
      { name: "Bronze", threshold: 0, multiplier: 1 },
      { name: "Silver", threshold: 500, multiplier: 1.5 },
      { name: "Gold", threshold: 2000, multiplier: 2 },
      { name: "Platinum", threshold: 5000, multiplier: 3 },
    ],
    benefits: ["Earn points on every purchase", "Member-only deals", "Birthday rewards", "Free shipping on select orders"],
    reviews: [
      { author: "Salma A.", rating: 4, comment: "Great starting tier. I love the birthday reward — got a nice surprise discount!", created_at: "2025-01-10T08:00:00Z" },
      { author: "Omar H.", rating: 5, comment: "Easy to join and I started earning points on day one. Very straightforward.", created_at: "2025-01-15T14:30:00Z" },
      { author: "Fatima K.", rating: 4, comment: "The member-only deals are actually good, not just marketing fluff.", created_at: "2025-02-01T10:00:00Z" },
      { author: "Yousef M.", rating: 3, comment: "Decent benefits for a free tier, but I wish the points earned faster.", created_at: "2025-02-10T16:45:00Z" },
      { author: "Nadia R.", rating: 5, comment: "Best loyalty program I've joined. Transparent and rewarding from the start.", created_at: "2025-02-20T12:00:00Z" },
    ],
  },
  {
    id: "loyalty-silver",
    name: "Silver",
    type: "tier",
    min_points: 500,
    perks: ["1.5x points earning", "Free shipping on orders over $50"],
    thumbnail: "/seed-images/loyalty%2F1612404730960-5c71577fca11.jpg",
    description: "Unlock 1.5x points earning and free shipping on qualifying orders.",
    tiers: [
      { name: "Bronze", threshold: 0, multiplier: 1 },
      { name: "Silver", threshold: 500, multiplier: 1.5 },
      { name: "Gold", threshold: 2000, multiplier: 2 },
      { name: "Platinum", threshold: 5000, multiplier: 3 },
    ],
    benefits: ["1.5x points earning rate", "Free shipping on orders over $50", "Early access to promotions", "Exclusive member events"],
    reviews: [
      { author: "Khalid B.", rating: 5, comment: "The 1.5x multiplier really adds up. Reached Gold in no time!", created_at: "2025-01-05T09:00:00Z" },
      { author: "Layla S.", rating: 4, comment: "Free shipping over $50 is a game changer for my regular orders.", created_at: "2025-01-18T11:30:00Z" },
      { author: "Ahmed T.", rating: 4, comment: "Early access to promotions helped me grab limited items before they sold out.", created_at: "2025-01-25T15:00:00Z" },
      { author: "Reem W.", rating: 5, comment: "Attending the exclusive member events was a highlight of my year.", created_at: "2025-02-05T08:30:00Z" },
      { author: "Tariq N.", rating: 3, comment: "Good value but the threshold to maintain Silver could be a bit lower.", created_at: "2025-02-15T17:00:00Z" },
    ],
  },
  {
    id: "loyalty-gold",
    name: "Gold",
    type: "tier",
    min_points: 2000,
    perks: ["2x points earning", "Free shipping on all orders", "Early access to sales"],
    thumbnail: "/seed-images/loyalty%2F1610375461246-83df859d849d.jpg",
    description: "Double your points, get free shipping on every order, and early access to all sales events.",
    tiers: [
      { name: "Bronze", threshold: 0, multiplier: 1 },
      { name: "Silver", threshold: 500, multiplier: 1.5 },
      { name: "Gold", threshold: 2000, multiplier: 2 },
      { name: "Platinum", threshold: 5000, multiplier: 3 },
    ],
    benefits: ["2x points earning rate", "Free shipping on all orders", "Early access to sales", "Priority customer support"],
    reviews: [
      { author: "Huda J.", rating: 5, comment: "Double points is incredible. I redeemed enough for a free vacation package.", created_at: "2025-01-08T13:00:00Z" },
      { author: "Badr F.", rating: 5, comment: "Priority support actually means something here — got help in under 2 minutes.", created_at: "2025-01-20T10:00:00Z" },
      { author: "Mona D.", rating: 4, comment: "Free shipping on all orders sealed the deal for me. No minimum is great.", created_at: "2025-02-02T09:15:00Z" },
      { author: "Faisal L.", rating: 4, comment: "The early access to sales is a real perk. I never miss out anymore.", created_at: "2025-02-12T14:30:00Z" },
      { author: "Sara Q.", rating: 5, comment: "Gold tier has been worth every purchase. The rewards feel truly premium.", created_at: "2025-02-22T11:00:00Z" },
    ],
  },
  {
    id: "loyalty-platinum",
    name: "Platinum",
    type: "tier",
    min_points: 5000,
    perks: ["3x points earning", "Free shipping", "Priority support", "Exclusive events"],
    thumbnail: "/seed-images/loyalty%2F1579547945413-497e1b99dac0.jpg",
    description: "Our top tier with 3x points, priority support, and invitations to exclusive VIP events.",
    tiers: [
      { name: "Bronze", threshold: 0, multiplier: 1 },
      { name: "Silver", threshold: 500, multiplier: 1.5 },
      { name: "Gold", threshold: 2000, multiplier: 2 },
      { name: "Platinum", threshold: 5000, multiplier: 3 },
    ],
    benefits: ["3x points earning rate", "Free shipping on all orders", "Priority support", "Exclusive VIP events", "Personal concierge service"],
    reviews: [
      { author: "Amira Z.", rating: 5, comment: "The personal concierge service is phenomenal. They arranged everything for my anniversary.", created_at: "2025-01-12T10:00:00Z" },
      { author: "Waleed G.", rating: 5, comment: "3x points means I'm constantly earning rewards. Platinum is absolutely worth it.", created_at: "2025-01-22T15:00:00Z" },
      { author: "Noura P.", rating: 5, comment: "The VIP events alone make Platinum membership priceless. Met amazing people.", created_at: "2025-02-03T12:30:00Z" },
      { author: "Hassan V.", rating: 4, comment: "Top-tier experience all around. Only wish there were more exclusive product launches.", created_at: "2025-02-14T09:00:00Z" },
      { author: "Dina E.", rating: 5, comment: "I've been Platinum for two years and the perks keep getting better. Truly VIP treatment.", created_at: "2025-02-25T16:00:00Z" },
    ],
  },
]

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const loyaltyService = req.scope.resolve("loyalty") as any
    const { id } = req.params

    try {
      const program = await loyaltyService.retrieveLoyaltyProgram(id)
      if (program) return res.json({ item: program })
    } catch {}

    try {
      const account = await loyaltyService.retrieveLoyaltyAccount(id)
      if (account) {
        const balance = await loyaltyService.getBalance(account.id)
        return res.json({ item: { ...account, ...balance } })
      }
    } catch {}

    const seedItem = SEED_DATA.find(i => i.id === id) || SEED_DATA[0]
    return res.json({ item: seedItem })
  } catch (error: any) {
    const { id } = req.params
    const seedItem = SEED_DATA.find(i => i.id === id) || SEED_DATA[0]
    return res.json({ item: seedItem })
  }
}

