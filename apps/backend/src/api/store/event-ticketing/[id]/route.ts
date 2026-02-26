import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

const SEED_DATA = [
  {
    id: "et_001",
    name: "Summer Music Festival 2026",
    title: "Summer Music Festival 2026",
    description: "A weekend of live music featuring top international artists across multiple stages.",
    venue: "Central Park Arena",
    date: "2026-07-15T19:00:00Z",
    category: "concerts",
    price: 8999,
    currency_code: "usd",
    tickets_available: 250,
    status: "published",
    thumbnail: "/seed-images/event-ticketing/1488646953014-85cb44e25828.jpg",
    reviews: [
      { author: "Alex D.", rating: 5, comment: "Incredible lineup and amazing atmosphere. The multiple stages meant no waiting between acts.", created_at: "2025-12-10T10:00:00Z" },
      { author: "Maria S.", rating: 5, comment: "Best festival I've attended! Sound quality was perfect and the venue was well-organized.", created_at: "2025-12-07T14:30:00Z" },
      { author: "Josh T.", rating: 4, comment: "Great music but the food lines were long. VIP area was worth the upgrade.", created_at: "2025-12-03T09:15:00Z" },
      { author: "Tanya K.", rating: 4, comment: "Loved every moment. Parking was a bit tricky but shuttle service worked great.", created_at: "2025-11-29T16:45:00Z" },
      { author: "Derek W.", rating: 5, comment: "Already bought tickets for next year. The weekend pass is an incredible value.", created_at: "2025-11-25T11:00:00Z" },
    ],
  },
  {
    id: "et_002",
    name: "Champions League Final Screening",
    title: "Champions League Final Screening",
    description: "Watch the Champions League final on the big screen with fellow fans. Food and drinks available.",
    venue: "City Sports Complex",
    date: "2026-05-30T20:00:00Z",
    category: "sports",
    price: 4999,
    currency_code: "usd",
    tickets_available: 500,
    status: "published",
    thumbnail: "/seed-images/bookings/1534438327276-14e5300c3a48.jpg",
    reviews: [
      { author: "Marco P.", rating: 5, comment: "Electric atmosphere! Watching with hundreds of fans made it so much better than home.", created_at: "2025-12-09T13:20:00Z" },
      { author: "Fatima H.", rating: 4, comment: "Great big screen quality. Food and drinks were reasonably priced. Fun evening out.", created_at: "2025-12-05T10:00:00Z" },
      { author: "Liam O.", rating: 5, comment: "Perfect way to watch the final. Commentary was clear and the crowd energy was unmatched.", created_at: "2025-12-01T15:45:00Z" },
      { author: "Nina J.", rating: 4, comment: "Good event but seating was limited. Arriving early is a must. Great atmosphere.", created_at: "2025-11-27T09:30:00Z" },
      { author: "Hassan M.", rating: 3, comment: "Fun experience but sound levels could have been better in the back rows.", created_at: "2025-11-23T12:15:00Z" },
    ],
  },
  {
    id: "et_003",
    name: "Shakespeare in the Park",
    title: "Shakespeare in the Park",
    description: "A modern rendition of A Midsummer Night's Dream performed under the stars.",
    venue: "Riverside Theater",
    date: "2026-08-10T18:30:00Z",
    category: "theater",
    price: 5999,
    currency_code: "usd",
    tickets_available: 120,
    status: "published",
    thumbnail: "/seed-images/event-ticketing/1507525428034-b723cf961d3e.jpg",
    reviews: [
      { author: "Eleanor V.", rating: 5, comment: "Magical performance under the stars. The modern take on Shakespeare was refreshing and engaging.", created_at: "2025-12-08T11:30:00Z" },
      { author: "William C.", rating: 5, comment: "The actors were phenomenal. Riverside Theater setting added so much to the atmosphere.", created_at: "2025-12-04T14:00:00Z" },
      { author: "Grace L.", rating: 4, comment: "Beautiful production. Bring a blanket as it gets cool by the riverside in the evening.", created_at: "2025-11-30T09:45:00Z" },
      { author: "David R.", rating: 4, comment: "Intimate venue makes every seat a good seat. Sound carried well outdoors.", created_at: "2025-11-26T16:20:00Z" },
      { author: "Sophie A.", rating: 5, comment: "A Midsummer Night's Dream has never been better. The modern twist was brilliantly done.", created_at: "2025-11-22T10:30:00Z" },
    ],
  },
  {
    id: "et_004",
    name: "Tech Innovation Summit 2026",
    title: "Tech Innovation Summit 2026",
    description: "Three days of keynotes, workshops, and networking with industry leaders in AI, blockchain, and cloud.",
    venue: "Convention Center Hall A",
    date: "2026-09-05T09:00:00Z",
    category: "conferences",
    price: 19999,
    currency_code: "usd",
    tickets_available: 1000,
    status: "published",
    thumbnail: "/seed-images/bundles/1519389950473-47ba0277781c.jpg",
    reviews: [
      { author: "Raj P.", rating: 5, comment: "World-class speakers and cutting-edge content. The AI workshop alone was worth the ticket.", created_at: "2025-12-10T09:00:00Z" },
      { author: "Samantha F.", rating: 4, comment: "Excellent networking opportunities. Met my next business partner here. Well-organized event.", created_at: "2025-12-06T12:45:00Z" },
      { author: "Kevin Z.", rating: 5, comment: "Three days of pure innovation. The blockchain panel discussions were incredibly insightful.", created_at: "2025-12-02T16:30:00Z" },
      { author: "Laura B.", rating: 4, comment: "Great conference but the venue could be bigger. Some sessions were standing room only.", created_at: "2025-11-28T10:15:00Z" },
      { author: "Tony G.", rating: 3, comment: "Good content but expensive. Early bird pricing makes it more reasonable.", created_at: "2025-11-24T14:00:00Z" },
    ],
  },
  {
    id: "et_005",
    name: "Food & Wine Festival",
    title: "Food & Wine Festival",
    description: "Sample cuisines from 50+ local restaurants and wineries. Live cooking demos and tastings.",
    venue: "Harbor Pavilion",
    date: "2026-06-22T12:00:00Z",
    category: "festivals",
    price: 7499,
    currency_code: "usd",
    tickets_available: 350,
    status: "published",
    thumbnail: "/seed-images/bundles/1504674900247-0877df9cc836.jpg",
    reviews: [
      { author: "Julia C.", rating: 5, comment: "50+ restaurants and the quality was consistently high. Live cooking demos were entertaining.", created_at: "2025-12-09T10:30:00Z" },
      { author: "Pierre M.", rating: 5, comment: "Wine tasting selection was incredible. Discovered several new favorite wineries.", created_at: "2025-12-05T15:00:00Z" },
      { author: "Andrea N.", rating: 4, comment: "Amazing food variety. Harbor Pavilion is a beautiful venue for this kind of event.", created_at: "2025-12-01T11:20:00Z" },
      { author: "Vincent L.", rating: 4, comment: "Great value for the ticket price. Unlimited tastings and the portions were generous.", created_at: "2025-11-27T14:45:00Z" },
      { author: "Diana K.", rating: 3, comment: "Wonderful food but very crowded by mid-afternoon. Go early for the best experience.", created_at: "2025-11-23T09:00:00Z" },
    ],
  },
]

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const moduleService = req.scope.resolve("eventTicketing") as any
    const { id } = req.params
    const item = await moduleService.retrieveEvent(id)
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
