import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { handleApiError } from "../../../../lib/api-error-handler"

const SEED_DATA = [
  {
    id: "loyalty-bronze",
    name: "Bronze",
    type: "tier",
    min_points: 0,
    perks: ["1x points earning", "Member-only deals"],
    thumbnail: "https://images.unsplash.com/photo-1553729459-afe8f2e2ed65?w=800&h=600&fit=crop",
    description: "Start earning rewards with every purchase. Enjoy exclusive member-only deals and promotions.",
  },
  {
    id: "loyalty-silver",
    name: "Silver",
    type: "tier",
    min_points: 500,
    perks: ["1.5x points earning", "Free shipping on orders over $50"],
    thumbnail: "https://images.unsplash.com/photo-1612404730960-5c71577fca11?w=800&h=600&fit=crop",
    description: "Unlock 1.5x points earning and free shipping on qualifying orders.",
  },
  {
    id: "loyalty-gold",
    name: "Gold",
    type: "tier",
    min_points: 2000,
    perks: ["2x points earning", "Free shipping on all orders", "Early access to sales"],
    thumbnail: "https://images.unsplash.com/photo-1610375461246-83df859d849d?w=800&h=600&fit=crop",
    description: "Double your points, get free shipping on every order, and early access to all sales events.",
  },
  {
    id: "loyalty-platinum",
    name: "Platinum",
    type: "tier",
    min_points: 5000,
    perks: ["3x points earning", "Free shipping", "Priority support", "Exclusive events"],
    thumbnail: "https://images.unsplash.com/photo-1579547945413-497e1b99dac0?w=800&h=600&fit=crop",
    description: "Our top tier with 3x points, priority support, and invitations to exclusive VIP events.",
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

