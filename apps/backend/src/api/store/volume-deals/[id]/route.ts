import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { handleApiError } from "../../../../lib/api-error-handler"

const SEED_DATA = [
  {
    id: "vd-seed-1",
    name: "Premium Ballpoint Pens",
    description: "Smooth-writing metal ballpoint pens with ergonomic grip. Blue ink. Ideal for corporate gifts.",
    category: "office",
    thumbnail: "/seed-images/freelance%2F1532094349884-543bc11b234d.jpg",
    status: "active",
    tiers: [{ qty: "10+", min_quantity: 10, max_quantity: 49, discount_percentage: 15, price: 499 }, { qty: "50+", min_quantity: 50, max_quantity: 99, discount_percentage: 30, price: 399 }, { qty: "100+", min_quantity: 100, max_quantity: null, discount_percentage: 40, price: 299 }],
    max_savings: 40,
    reviews: [
      { author: "Mohammed A.", rating: 5, comment: "Ordered 100 pens for our corporate event. Excellent quality and great discount.", created_at: "2024-11-14T10:00:00Z" },
      { author: "Sara H.", rating: 4, comment: "Smooth writing and professional look. The bulk pricing made it affordable.", created_at: "2024-11-01T14:30:00Z" },
      { author: "Khalid R.", rating: 5, comment: "Perfect for client gifts. The 40% discount at 100+ units is unbeatable.", created_at: "2024-10-18T09:15:00Z" },
      { author: "Noura M.", rating: 4, comment: "Good pens for daily office use. Ergonomic grip is comfortable.", created_at: "2024-10-05T16:00:00Z" },
      { author: "Faisal K.", rating: 5, comment: "Re-ordered for the third time. Consistent quality at great prices.", created_at: "2024-09-20T11:30:00Z" },
    ],
  },
  {
    id: "vd-seed-2",
    name: "Reusable Shopping Bags",
    description: "Eco-friendly non-woven bags, full-color printing available. Perfect for retail promotions.",
    category: "retail",
    thumbnail: "/seed-images/memberships%2F1441986300917-64674bd600d8.jpg",
    status: "active",
    tiers: [{ qty: "10+", min_quantity: 10, max_quantity: 49, discount_percentage: 20, price: 350 }, { qty: "50+", min_quantity: 50, max_quantity: 99, discount_percentage: 40, price: 250 }, { qty: "100+", min_quantity: 100, max_quantity: null, discount_percentage: 57, price: 150 }],
    max_savings: 57,
    reviews: [
      { author: "Layla B.", rating: 5, comment: "Great eco-friendly bags for our retail stores. Customers love them!", created_at: "2024-11-12T08:00:00Z" },
      { author: "Ahmed S.", rating: 5, comment: "Full-color printing looks amazing. The 57% savings at scale is incredible.", created_at: "2024-10-28T13:30:00Z" },
      { author: "Huda T.", rating: 4, comment: "Sturdy bags that hold up well. Perfect for our grocery store.", created_at: "2024-10-15T10:45:00Z" },
      { author: "Omar W.", rating: 5, comment: "Ordered 200 bags with our logo. Delivery was fast and quality was top.", created_at: "2024-09-30T15:00:00Z" },
      { author: "Mona F.", rating: 4, comment: "Good quality non-woven material. Will order again for next season.", created_at: "2024-09-12T09:30:00Z" },
    ],
  },
  {
    id: "vd-seed-3",
    name: "USB Flash Drives 32GB",
    description: "Compact USB 3.0 flash drives with custom logo area. Bulk pricing for events and conferences.",
    category: "electronics",
    thumbnail: "/seed-images/auctions%2F1526170375885-4d8ecf77b99f.jpg",
    status: "active",
    tiers: [{ qty: "10+", min_quantity: 10, max_quantity: 49, discount_percentage: 10, price: 899 }, { qty: "50+", min_quantity: 50, max_quantity: 99, discount_percentage: 25, price: 699 }, { qty: "100+", min_quantity: 100, max_quantity: null, discount_percentage: 45, price: 499 }],
    max_savings: 45,
    reviews: [
      { author: "Tariq N.", rating: 5, comment: "Bought 100 drives for our conference. Fast USB 3.0 speed and reliable.", created_at: "2024-11-08T11:00:00Z" },
      { author: "Reem D.", rating: 4, comment: "Good storage capacity and the custom logo area is a nice touch.", created_at: "2024-10-22T14:30:00Z" },
      { author: "Bader L.", rating: 5, comment: "Compact design and great bulk pricing. Perfect for event giveaways.", created_at: "2024-10-06T09:00:00Z" },
      { author: "Nadia G.", rating: 4, comment: "Reliable drives that work well. 45% discount made it a no-brainer.", created_at: "2024-09-18T16:15:00Z" },
      { author: "Hamza J.", rating: 5, comment: "Used for training materials distribution. Excellent value at 100+ units.", created_at: "2024-09-02T10:30:00Z" },
    ],
  },
  {
    id: "vd-seed-4",
    name: "Cotton Face Towels",
    description: "500 GSM premium cotton towels. Machine washable, quick-drying. Hotel and spa grade quality.",
    category: "hospitality",
    thumbnail: "/seed-images/trade-in%2F1524758631624-e2822e304c36.jpg",
    status: "active",
    tiers: [{ qty: "10+", min_quantity: 10, max_quantity: 49, discount_percentage: 15, price: 699 }, { qty: "50+", min_quantity: 50, max_quantity: 99, discount_percentage: 30, price: 549 }, { qty: "100+", min_quantity: 100, max_quantity: null, discount_percentage: 43, price: 399 }],
    max_savings: 43,
    reviews: [
      { author: "Sultan Q.", rating: 5, comment: "Premium quality towels for our hotel. Guests always compliment them.", created_at: "2024-11-06T07:00:00Z" },
      { author: "Ghada A.", rating: 5, comment: "500 GSM feels luxurious. Quick-drying is a bonus for our spa.", created_at: "2024-10-20T12:00:00Z" },
      { author: "Waleed K.", rating: 4, comment: "Good hotel-grade towels. Held up well after many washes.", created_at: "2024-10-04T08:30:00Z" },
      { author: "Amira S.", rating: 5, comment: "Ordered 100 towels and saved 43%. Can't beat that value.", created_at: "2024-09-15T14:45:00Z" },
      { author: "Rashid M.", rating: 4, comment: "Consistent quality across the batch. Will reorder quarterly.", created_at: "2024-09-01T10:00:00Z" },
    ],
  },
  {
    id: "vd-seed-5",
    name: "Corrugated Shipping Boxes",
    description: "Heavy-duty double-wall corrugated boxes. Standard sizes available. Custom sizes on request.",
    category: "packaging",
    thumbnail: "/seed-images/government%2F1450101499163-c8848c66ca85.jpg",
    status: "active",
    tiers: [{ qty: "10+", min_quantity: 10, max_quantity: 49, discount_percentage: 20, price: 299 }, { qty: "50+", min_quantity: 50, max_quantity: 99, discount_percentage: 40, price: 199 }, { qty: "100+", min_quantity: 100, max_quantity: null, discount_percentage: 57, price: 129 }],
    max_savings: 57,
    reviews: [
      { author: "Jamal H.", rating: 5, comment: "Heavy-duty boxes that protect our products during shipping. Excellent.", created_at: "2024-11-04T09:00:00Z" },
      { author: "Dina R.", rating: 4, comment: "Double-wall construction is very sturdy. Great for fragile items.", created_at: "2024-10-18T11:30:00Z" },
      { author: "Sami B.", rating: 5, comment: "57% savings at bulk quantity. These boxes are our standard now.", created_at: "2024-10-02T14:00:00Z" },
      { author: "Lina T.", rating: 5, comment: "Ordered custom sizes and they delivered perfectly. Highly recommend.", created_at: "2024-09-16T08:15:00Z" },
      { author: "Mazen F.", rating: 4, comment: "Good quality corrugated boxes. Fast delivery even for large orders.", created_at: "2024-09-01T15:30:00Z" },
    ],
  },
]

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
    const { id } = req.params

    const { data: rules } = await query.graph({
      entity: "volume_pricing",
      fields: ["id", "name", "description", "applies_to", "target_id", "pricing_type", "priority", "status", "starts_at", "ends_at", "created_at"],
      filters: { id },
    })

    const rule = Array.isArray(rules) ? rules[0] : rules
    if (!rule) {
      const seedItem = SEED_DATA.find((s) => s.id === id) || SEED_DATA[0]
      return res.json({ item: seedItem })
    }

    const { data: tiers } = await query.graph({
      entity: "volume_pricing_tier",
      fields: ["id", "volume_pricing_id", "min_quantity", "max_quantity", "discount_percentage", "discount_amount", "fixed_price", "currency_code"],
      filters: { volume_pricing_id: rule.id },
    })

    return res.json({ item: { ...rule, tiers } })
  } catch (error: any) {
    const seedItem = SEED_DATA.find((s) => s.id === req.params.id) || SEED_DATA[0]
    return res.json({ item: seedItem })
  }
}
