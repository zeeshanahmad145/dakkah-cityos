import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { handleApiError } from "../../../../lib/api-error-handler"

const SEED_DATA = [
  {
    id: "tby_001",
    name: "Premium Noise-Cancelling Headphones",
    title: "Premium Noise-Cancelling Headphones",
    description: "Experience world-class ANC with 30hr battery life. Try them for 14 days risk-free before you commit.",
    category: "electronics",
    trial_period: 14,
    deposit: 4999,
    currency_code: "usd",
    status: "approved",
    thumbnail: "/seed-images/auctions%2F1505740420928-5e560c06d30e.jpg",
    included: ["Free shipping both ways", "14-day risk-free trial", "Full refund if returned", "Original packaging included"],
    reviews: [
      { author: "Ahmed R.", rating: 5, comment: "Tried the headphones for 14 days and fell in love. The ANC is incredible.", created_at: "2024-11-14T09:00:00Z" },
      { author: "Nadia K.", rating: 5, comment: "Risk-free trial made the decision easy. Kept them without hesitation.", created_at: "2024-11-02T15:30:00Z" },
      { author: "Faris M.", rating: 4, comment: "Great sound quality. The 14 days gave me enough time to test everything.", created_at: "2024-10-18T10:00:00Z" },
      { author: "Hala S.", rating: 5, comment: "Best purchase decision thanks to the try-before-you-buy option.", created_at: "2024-10-03T14:45:00Z" },
      { author: "Omar B.", rating: 4, comment: "Comfortable for long listening sessions. Free returns made me confident.", created_at: "2024-09-16T11:30:00Z" },
    ],
  },
  {
    id: "tby_002",
    name: "Ergonomic Office Chair",
    title: "Ergonomic Office Chair",
    description: "Adjustable lumbar support, breathable mesh, and 4D armrests. Perfect for your home office setup.",
    category: "furniture",
    trial_period: 30,
    deposit: 9999,
    currency_code: "usd",
    status: "approved",
    thumbnail: "/seed-images/classifieds%2F1555041469-a586c61ea9bc.jpg",
    included: ["Free delivery and pickup", "30-day home trial", "No questions asked returns", "Assembly service included"],
    reviews: [
      { author: "Salma W.", rating: 5, comment: "30 days was perfect to test the chair. My back pain disappeared!", created_at: "2024-11-10T08:00:00Z" },
      { author: "Majed T.", rating: 5, comment: "Assembly service was a nice touch. The chair is worth every penny.", created_at: "2024-10-25T13:00:00Z" },
      { author: "Dina A.", rating: 4, comment: "Very comfortable chair. The 30-day trial gave me peace of mind.", created_at: "2024-10-08T16:30:00Z" },
      { author: "Waleed H.", rating: 5, comment: "Returned one chair and tried another model. No hassle at all.", created_at: "2024-09-22T10:15:00Z" },
      { author: "Reem F.", rating: 4, comment: "Great quality and the no-questions-asked return policy is genuine.", created_at: "2024-09-05T14:00:00Z" },
    ],
  },
  {
    id: "tby_003",
    name: "Smart Fitness Tracker",
    title: "Smart Fitness Tracker",
    description: "Track steps, heart rate, sleep quality, and 20+ workout modes. Water-resistant to 50m.",
    category: "electronics",
    trial_period: 14,
    deposit: 2499,
    currency_code: "usd",
    status: "approved",
    thumbnail: "/seed-images/bundles%2F1571019613454-1cb2f99b2d8b.jpg",
    included: ["Free shipping both ways", "14-day trial period", "Charging cable and dock", "Quick start guide"],
    reviews: [
      { author: "Lina D.", rating: 5, comment: "Tracked my workouts for 2 weeks before deciding. Absolutely love it.", created_at: "2024-11-08T07:30:00Z" },
      { author: "Badr N.", rating: 4, comment: "Accurate heart rate monitoring. The sleep tracking convinced me to keep it.", created_at: "2024-10-22T09:00:00Z" },
      { author: "Hanan G.", rating: 5, comment: "Perfect for my swimming routine. Water resistance is excellent.", created_at: "2024-10-06T15:45:00Z" },
      { author: "Tariq K.", rating: 4, comment: "Good fitness tracker. Trial period helped me compare with other brands.", created_at: "2024-09-18T11:00:00Z" },
      { author: "Mona S.", rating: 5, comment: "The try-before-you-buy option is genius. No more buyer's remorse!", created_at: "2024-09-02T08:30:00Z" },
    ],
  },
  {
    id: "tby_004",
    name: "Designer Sunglasses",
    title: "Designer Sunglasses",
    description: "Polarized lenses with UV400 protection. Italian acetate frames with titanium hinges.",
    category: "fashion",
    trial_period: 7,
    deposit: 3499,
    currency_code: "usd",
    status: "approved",
    thumbnail: "/seed-images/trade-in%2F1542291026-7eec264c27ff.jpg",
    included: ["Free express shipping", "7-day home trial", "Protective case included", "Free return shipping label"],
    reviews: [
      { author: "Aisha L.", rating: 5, comment: "Tried them for a week and they fit perfectly. The polarized lenses are amazing.", created_at: "2024-11-06T12:00:00Z" },
      { author: "Saud M.", rating: 4, comment: "Premium feel and look. The 7-day trial was enough to decide.", created_at: "2024-10-20T14:30:00Z" },
      { author: "Nouf B.", rating: 5, comment: "Beautiful frames. Love that I could try before committing to the price.", created_at: "2024-10-04T10:45:00Z" },
      { author: "Hamza R.", rating: 5, comment: "UV protection is excellent. Kept them right away after the trial.", created_at: "2024-09-16T16:00:00Z" },
      { author: "Ghada T.", rating: 4, comment: "Stylish and lightweight. Return label was included which I appreciated.", created_at: "2024-09-01T11:15:00Z" },
    ],
  },
  {
    id: "tby_005",
    name: "Professional Espresso Machine",
    title: "Professional Espresso Machine",
    description: "Dual boiler system with PID temperature control. Barista-grade coffee at home.",
    category: "home",
    trial_period: 30,
    deposit: 14999,
    currency_code: "usd",
    status: "approved",
    thumbnail: "/seed-images/trade-in%2F1524758631624-e2822e304c36.jpg",
    included: ["Free white-glove delivery", "30-day trial period", "All accessories and portafilter", "Barista starter kit with beans"],
    reviews: [
      { author: "Khalid J.", rating: 5, comment: "Made café-quality espresso at home for a month. Now it's mine forever!", created_at: "2024-11-04T07:00:00Z" },
      { author: "Fatima N.", rating: 5, comment: "White-glove delivery was impressive. The machine is a dream.", created_at: "2024-10-18T08:30:00Z" },
      { author: "Sultan A.", rating: 4, comment: "Dual boiler makes a huge difference. PID control gives consistent shots.", created_at: "2024-10-02T09:15:00Z" },
      { author: "Amira H.", rating: 5, comment: "The barista starter kit was a great bonus. Perfect for learning.", created_at: "2024-09-15T10:00:00Z" },
      { author: "Mansour W.", rating: 4, comment: "30 days was just right to master the machine. Decided to keep it.", created_at: "2024-08-28T07:45:00Z" },
    ],
  },
]

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const vendorService = req.scope.resolve("vendor") as any
    const { id } = req.params
    const item = await vendorService.retrieveVendorProduct(id)
    if (!item) {
      const seedItem = SEED_DATA.find(s => s.id === id) || SEED_DATA[0]
      return res.json({ item: seedItem })
    }
    return res.json({ item })
  } catch (error: any) {
    const seedItem = SEED_DATA.find(s => s.id === req.params.id) || SEED_DATA[0]
    return res.json({ item: seedItem })
  }
}
