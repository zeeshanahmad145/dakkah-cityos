import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { handleApiError } from "../../../../lib/api-error-handler"

const SEED_DATA = [
  {
    id: "campaign-seed-1",
    title: "Summer Clearance Sale",
    description: "Massive discounts on summer collections. Up to 60% off on selected items across all categories.",
    type: "seasonal",
    status: "active",
    thumbnail: "/seed-images/affiliate/1483985988355-763728e1935b.jpg",
    metadata: {
      image: "/seed-images/affiliate/1483985988355-763728e1935b.jpg",
      discount: "60%",
      discount_label: "Up to 60% Off",
    },
    starts_at: "2025-06-01T00:00:00Z",
    ends_at: "2025-08-31T23:59:59Z",
    raised_amount: 4250000,
    goal_amount: 10000000,
    backers_count: 312,
    days_remaining: 45,
    currency_code: "USD",
    updates: [
      { id: "upd-1", created_at: "2025-06-15T10:00:00Z", title: "Campaign Launched!", content: "We're thrilled to announce the start of our Summer Clearance Sale campaign. Thank you for your early support!" },
      { id: "upd-2", created_at: "2025-07-01T14:00:00Z", title: "Halfway There", content: "We've reached 40% of our goal in just two weeks. New items added to the clearance list!" },
      { id: "upd-3", created_at: "2025-07-20T09:00:00Z", title: "Stretch Goal Unlocked", content: "Thanks to your overwhelming support, we've unlocked our first stretch goal — free shipping on all orders over $50." },
    ],
    reward_tiers: [
      { id: "tier-1", title: "Early Bird", description: "Get 10% extra discount on top of sale prices", pledge_amount: 2500, currency_code: "USD", estimated_delivery: "2025-07-15", limited_quantity: 100, claimed: 78, includes: ["10% extra discount", "Free shipping"] },
      { id: "tier-2", title: "VIP Shopper", description: "Exclusive early access to new markdowns plus a gift card", pledge_amount: 5000, currency_code: "USD", estimated_delivery: "2025-07-20", limited_quantity: 50, claimed: 32, includes: ["Early access", "$25 gift card", "Free shipping"] },
      { id: "tier-3", title: "Ultimate Bundle", description: "Curated bundle of top clearance items plus VIP perks", pledge_amount: 10000, currency_code: "USD", estimated_delivery: "2025-08-01", limited_quantity: 25, claimed: 11, includes: ["Curated bundle", "VIP perks", "Personal shopper session"] },
    ],
    reviews: [
      { author: "Sarah M.", rating: 5, comment: "Incredible deals across the board. I saved over $200 on summer items!", created_at: "2025-07-10T08:00:00Z" },
      { author: "David K.", rating: 5, comment: "The best summer clearance event I've ever shopped. Great selection and fast shipping.", created_at: "2025-07-05T14:30:00Z" },
      { author: "Amina R.", rating: 4, comment: "Solid discounts on quality items. Some sizes sold out quickly though.", created_at: "2025-06-28T10:00:00Z" },
      { author: "James L.", rating: 5, comment: "Up to 60% off wasn't an exaggeration. Stocked up for next summer too!", created_at: "2025-06-20T16:00:00Z" },
      { author: "Priya N.", rating: 4, comment: "Good variety of products on sale. Would love to see more home goods next time.", created_at: "2025-06-15T09:30:00Z" },
    ],
  },
  {
    id: "campaign-seed-2",
    title: "Flash Friday Deals",
    description: "24-hour flash deals every Friday. Limited stock, unbeatable prices on top brands.",
    type: "flash",
    status: "active",
    thumbnail: "/seed-images/campaigns/1556742049-0cfed4f6a45d.jpg",
    metadata: {
      image: "/seed-images/campaigns/1556742049-0cfed4f6a45d.jpg",
      discount: "40%",
      discount_label: "Up to 40% Off",
    },
    starts_at: "2025-01-01T00:00:00Z",
    ends_at: "2025-12-31T23:59:59Z",
    raised_amount: 1800000,
    goal_amount: 5000000,
    backers_count: 145,
    days_remaining: 120,
    currency_code: "USD",
    updates: [
      { id: "upd-4", created_at: "2025-01-10T08:00:00Z", title: "Flash Friday is Live!", content: "Our first Flash Friday is here with deals on electronics, fashion, and home goods." },
      { id: "upd-5", created_at: "2025-02-14T12:00:00Z", title: "Valentine's Special", content: "Extra flash deals added for Valentine's Day — don't miss out on gift ideas!" },
      { id: "upd-6", created_at: "2025-03-01T10:00:00Z", title: "March Madness Deals", content: "Spring is here and so are fresh new deals every Friday this month." },
    ],
    reward_tiers: [],
    reviews: [
      { author: "Omar B.", rating: 5, comment: "Flash Friday is my new favorite shopping tradition. Unbeatable prices every week!", created_at: "2025-03-14T12:00:00Z" },
      { author: "Linda W.", rating: 4, comment: "Great concept — love the urgency. Scored an amazing deal on headphones.", created_at: "2025-02-28T10:00:00Z" },
      { author: "Chen H.", rating: 5, comment: "The Valentine's special had perfect gift options at fantastic prices.", created_at: "2025-02-15T09:00:00Z" },
      { author: "Fatima S.", rating: 4, comment: "Deals sell out fast but if you're quick, the savings are real.", created_at: "2025-01-31T14:00:00Z" },
      { author: "Marcus T.", rating: 5, comment: "Been following Flash Friday for months now. Consistently impressed with the deals.", created_at: "2025-01-17T11:30:00Z" },
    ],
  },
  {
    id: "campaign-seed-3",
    title: "End of Season Clearance",
    description: "Final markdowns on winter inventory. Everything must go to make room for new arrivals.",
    type: "clearance",
    status: "active",
    thumbnail: "/seed-images/affiliate/1483985988355-763728e1935b.jpg",
    metadata: {
      image: "/seed-images/affiliate/1483985988355-763728e1935b.jpg",
      discount: "70%",
      discount_label: "Up to 70% Off",
    },
    starts_at: "2025-02-01T00:00:00Z",
    ends_at: "2025-03-31T23:59:59Z",
    raised_amount: 6500000,
    goal_amount: 8000000,
    backers_count: 489,
    days_remaining: 15,
    currency_code: "USD",
    updates: [
      { id: "upd-7", created_at: "2025-02-05T10:00:00Z", title: "Clearance Has Begun!", content: "Winter inventory is being marked down. Shop early for the best selection." },
      { id: "upd-8", created_at: "2025-02-20T14:00:00Z", title: "Additional 20% Off", content: "We've added an extra 20% off already reduced items. Supplies are going fast!" },
      { id: "upd-9", created_at: "2025-03-10T09:00:00Z", title: "Final Week!", content: "Last chance to grab winter essentials at the lowest prices of the season." },
    ],
    reward_tiers: [],
    reviews: [
      { author: "Elena V.", rating: 5, comment: "Scored winter coats at 70% off! The quality was still excellent despite the deep discounts.", created_at: "2025-03-15T08:00:00Z" },
      { author: "Khalid A.", rating: 5, comment: "Best end-of-season sale I've seen. Cleared out my wishlist at amazing prices.", created_at: "2025-03-08T10:30:00Z" },
      { author: "Jessica P.", rating: 4, comment: "Great savings on boots and outerwear. Selection was still good even late in the sale.", created_at: "2025-02-28T14:00:00Z" },
      { author: "Tom R.", rating: 5, comment: "The additional 20% off already reduced items was incredible. Stocked up for next winter.", created_at: "2025-02-22T09:00:00Z" },
      { author: "Nadia F.", rating: 4, comment: "Good clearance event. Wish it lasted a bit longer but the deals were genuine.", created_at: "2025-02-10T11:00:00Z" },
    ],
  },
  {
    id: "campaign-seed-4",
    title: "Holiday Gift Guide",
    description: "Curated gift collections for everyone on your list. Special bundles and free gift wrapping.",
    type: "holiday",
    status: "active",
    thumbnail: "/seed-images/campaigns/1503676260728-1c00da094a0b.jpg",
    metadata: {
      image: "/seed-images/campaigns/1503676260728-1c00da094a0b.jpg",
      discount: "30%",
      discount_label: "30% Off Bundles",
    },
    starts_at: "2025-11-15T00:00:00Z",
    ends_at: "2025-12-31T23:59:59Z",
    raised_amount: 2100000,
    goal_amount: 7000000,
    backers_count: 198,
    days_remaining: 60,
    currency_code: "USD",
    updates: [
      { id: "upd-10", created_at: "2025-11-20T10:00:00Z", title: "Gift Guide is Live!", content: "Browse our curated collections for everyone on your list this holiday season." },
      { id: "upd-11", created_at: "2025-12-01T12:00:00Z", title: "Free Gift Wrapping", content: "All orders now include complimentary gift wrapping. Perfect for the holidays!" },
      { id: "upd-12", created_at: "2025-12-15T09:00:00Z", title: "Last Shipping Day", content: "Order by December 18th for guaranteed delivery before Christmas." },
    ],
    reward_tiers: [],
    reviews: [
      { author: "Michael C.", rating: 5, comment: "The gift bundles were perfectly curated. Made holiday shopping so easy!", created_at: "2025-12-20T10:00:00Z" },
      { author: "Aisha K.", rating: 5, comment: "Free gift wrapping was a wonderful touch. Everything arrived beautifully presented.", created_at: "2025-12-15T08:30:00Z" },
      { author: "Robert S.", rating: 4, comment: "Great selection of gifts at 30% off. Shipping was fast even during the holiday rush.", created_at: "2025-12-10T14:00:00Z" },
      { author: "Hannah L.", rating: 5, comment: "Found unique gifts I wouldn't have discovered otherwise. The guide was super helpful.", created_at: "2025-12-01T09:00:00Z" },
      { author: "Yusuf M.", rating: 4, comment: "Solid holiday deals. The bundle pricing made it easy to stay on budget.", created_at: "2025-11-25T11:30:00Z" },
    ],
  },
  {
    id: "campaign-seed-5",
    title: "Back to School Savings",
    description: "Stock up on school supplies, electronics, and dorm essentials at discounted prices.",
    type: "seasonal",
    status: "active",
    thumbnail: "/seed-images/campaigns/1503676260728-1c00da094a0b.jpg",
    metadata: {
      image: "/seed-images/campaigns/1503676260728-1c00da094a0b.jpg",
      discount: "25%",
      discount_label: "25% Off",
    },
    starts_at: "2025-07-15T00:00:00Z",
    ends_at: "2025-09-15T23:59:59Z",
    raised_amount: 950000,
    goal_amount: 3000000,
    backers_count: 87,
    days_remaining: 90,
    currency_code: "USD",
    updates: [
      { id: "upd-13", created_at: "2025-07-20T10:00:00Z", title: "Back to School Kickoff!", content: "Get ready for the new school year with our curated savings on supplies and tech." },
      { id: "upd-14", created_at: "2025-08-01T14:00:00Z", title: "Dorm Room Essentials Added", content: "New categories added: bedding, storage, and mini appliances at student-friendly prices." },
      { id: "upd-15", created_at: "2025-08-15T09:00:00Z", title: "Electronics Blowout", content: "Laptops, tablets, and accessories now up to 25% off for a limited time." },
    ],
    reward_tiers: [],
    reviews: [
      { author: "Jennifer W.", rating: 5, comment: "Saved a fortune on school supplies. Everything my kids needed at great prices!", created_at: "2025-08-20T08:00:00Z" },
      { author: "Ahmed H.", rating: 4, comment: "Good deals on laptops and tablets. The student discount stacked nicely.", created_at: "2025-08-10T10:30:00Z" },
      { author: "Maria G.", rating: 5, comment: "The dorm essentials section was exactly what we needed. One-stop shopping!", created_at: "2025-08-05T14:00:00Z" },
      { author: "Kevin T.", rating: 4, comment: "Decent electronics deals. Would love to see more brand options next year.", created_at: "2025-07-28T09:00:00Z" },
      { author: "Samira N.", rating: 5, comment: "Best back-to-school sale around. Organized, easy to browse, and genuinely discounted.", created_at: "2025-07-22T11:00:00Z" },
    ],
  },
]

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const crowdfundingService = req.scope.resolve("crowdfunding") as any
    const { id } = req.params
    const item = await crowdfundingService.retrieveCampaign(id)
    if (item) return res.json({ item })
    const seedItem = SEED_DATA.find(i => i.id === id) || SEED_DATA[0]
    return res.json({ item: seedItem })
  } catch (error: any) {
    const { id } = req.params
    const seedItem = SEED_DATA.find(i => i.id === id) || SEED_DATA[0]
    return res.json({ item: seedItem })
  }
}
