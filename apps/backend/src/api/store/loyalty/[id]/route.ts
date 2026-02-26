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

