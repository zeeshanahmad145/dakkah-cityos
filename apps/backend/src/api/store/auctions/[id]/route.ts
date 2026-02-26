import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"


const SEED_DATA = [
  {
    id: "auction_seed_1",
    tenant_id: "default",
    product_id: "prod_auction_1",
    title: "Luxury Swiss Chronograph Watch",
    description: "Rare limited-edition Swiss-made chronograph with sapphire crystal, 18K gold case, and automatic movement. Complete with original box and papers.",
    auction_type: "english",
    status: "active",
    starting_price: 250000,
    reserve_price: 500000,
    current_price: 375000,
    currency_code: "SAR",
    bid_increment: 5000,
    bid_count: 12,
    total_bids: 12,
    starts_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    ends_at: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(),
    metadata: { thumbnail: "/seed-images/auctions%2F1523275335684-37898b6baf30.jpg" },
    thumbnail: "/seed-images/auctions%2F1523275335684-37898b6baf30.jpg",
    reviews: [{ author: "Hassan Al-Rashid", rating: 5, comment: "Stunning timepiece, exactly as described. The auction process was transparent and exciting.", created_at: "2025-01-15T00:00:00Z" }, { author: "Pierre Dubois", rating: 5, comment: "Authentic Swiss craftsmanship. The gold case is absolutely magnificent in person.", created_at: "2025-01-10T00:00:00Z" }, { author: "Yuki Sato", rating: 4, comment: "Beautiful watch with excellent provenance. Bidding was competitive but fair.", created_at: "2025-01-05T00:00:00Z" }, { author: "Elena Volkov", rating: 5, comment: "The automatic movement keeps perfect time. A true collector's piece worth every bid.", created_at: "2024-12-28T00:00:00Z" }, { author: "Marco Bianchi", rating: 4, comment: "Impressive quality and the sapphire crystal is flawless. Delivery was well-packaged.", created_at: "2024-12-20T00:00:00Z" }],
  },
  {
    id: "auction_seed_2",
    tenant_id: "default",
    product_id: "prod_auction_2",
    title: "Original Abstract Oil Painting",
    description: "Stunning vintage abstract expressionist oil on canvas from the 1960s. Gallery-quality framing included. Authenticated by leading art experts.",
    auction_type: "english",
    status: "active",
    starting_price: 150000,
    reserve_price: 300000,
    current_price: 220000,
    currency_code: "SAR",
    bid_increment: 10000,
    bid_count: 8,
    total_bids: 8,
    starts_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    ends_at: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    metadata: { thumbnail: "/seed-images/auctions%2F1526170375885-4d8ecf77b99f.jpg" },
    thumbnail: "/seed-images/auctions%2F1526170375885-4d8ecf77b99f.jpg",
    reviews: [{ author: "Victoria Chen", rating: 5, comment: "The colors are breathtaking in person. Authentication was thorough and reassuring.", created_at: "2025-01-12T00:00:00Z" }, { author: "Robert Kline", rating: 4, comment: "Gallery-quality framing adds tremendous value. A centerpiece for any collection.", created_at: "2025-01-08T00:00:00Z" }, { author: "Amira Nasser", rating: 5, comment: "Exceptional abstract work from a pivotal era. The auction house provided excellent provenance.", created_at: "2025-01-02T00:00:00Z" }, { author: "David Thompson", rating: 4, comment: "Beautiful piece that exceeded my expectations. Secure shipping and handling.", created_at: "2024-12-25T00:00:00Z" }, { author: "Sophie Laurent", rating: 5, comment: "A museum-worthy painting. The bidding experience was thrilling and well-managed.", created_at: "2024-12-18T00:00:00Z" }],
  },
  {
    id: "auction_seed_3",
    tenant_id: "default",
    product_id: "prod_auction_3",
    title: "1967 Classic Muscle Car",
    description: "Fully restored classic American muscle car with matching numbers engine, original interior, and show-quality paint. A true collector's dream.",
    auction_type: "reserve",
    status: "active",
    starting_price: 800000,
    reserve_price: 1500000,
    current_price: 1100000,
    currency_code: "SAR",
    bid_increment: 25000,
    bid_count: 15,
    total_bids: 15,
    starts_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    ends_at: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    metadata: { thumbnail: "/seed-images/auctions%2F1489824904134-891ab64532f1.jpg" },
    thumbnail: "/seed-images/auctions%2F1489824904134-891ab64532f1.jpg",
    reviews: [{ author: "James Mitchell", rating: 5, comment: "A dream car in pristine condition. The restoration work is absolutely flawless.", created_at: "2025-01-14T00:00:00Z" }, { author: "Carlos Rivera", rating: 5, comment: "Matching numbers engine and original interior — a true find. Worth every penny.", created_at: "2025-01-09T00:00:00Z" }, { author: "Frank Weber", rating: 4, comment: "Show-quality paint job and the engine purrs beautifully. A collector's dream come true.", created_at: "2025-01-03T00:00:00Z" }, { author: "Ahmed Mansour", rating: 5, comment: "Exceptional muscle car. The documentation and history file were comprehensive.", created_at: "2024-12-27T00:00:00Z" }, { author: "Steve O'Connor", rating: 4, comment: "Classic American power. The auction platform made bidding smooth and transparent.", created_at: "2024-12-19T00:00:00Z" }],
  },
  {
    id: "auction_seed_4",
    tenant_id: "default",
    product_id: "prod_auction_4",
    title: "Rare Diamond & Emerald Necklace",
    description: "Exquisite 18K white gold necklace featuring 5 carats of VS1 diamonds and Colombian emeralds. Includes GIA certification and luxury case.",
    auction_type: "sealed",
    status: "active",
    starting_price: 400000,
    reserve_price: 750000,
    current_price: 520000,
    currency_code: "SAR",
    bid_increment: 15000,
    bid_count: 6,
    total_bids: 6,
    starts_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    ends_at: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString(),
    metadata: { thumbnail: "/seed-images/auctions%2F1560472355-536de3962603.jpg" },
    thumbnail: "/seed-images/auctions%2F1560472355-536de3962603.jpg",
    reviews: [{ author: "Lena Goldstein", rating: 5, comment: "The emeralds have an incredible deep green color. GIA certification gives full confidence.", created_at: "2025-01-13T00:00:00Z" }, { author: "Fatima Al-Sayed", rating: 5, comment: "Exquisite craftsmanship. The diamond settings are precise and the necklace catches light beautifully.", created_at: "2025-01-07T00:00:00Z" }, { author: "Isabella Romano", rating: 4, comment: "Gorgeous piece. The luxury case presentation made it feel truly special.", created_at: "2025-01-01T00:00:00Z" }, { author: "Natasha Petrov", rating: 5, comment: "VS1 diamonds are brilliantly clear. A statement piece for any formal occasion.", created_at: "2024-12-24T00:00:00Z" }, { author: "Grace Kim", rating: 4, comment: "Stunning design and the Colombian emeralds are vivid. Sealed bid process was fair.", created_at: "2024-12-16T00:00:00Z" }],
  },
  {
    id: "auction_seed_5",
    tenant_id: "default",
    product_id: "prod_auction_5",
    title: "Ancient Gold Coin Collection",
    description: "Museum-quality collection of 12 ancient gold coins spanning Roman, Byzantine, and Islamic periods. Each coin individually graded and certified.",
    auction_type: "dutch",
    status: "active",
    starting_price: 600000,
    reserve_price: 400000,
    current_price: 480000,
    currency_code: "SAR",
    bid_increment: 10000,
    bid_count: 4,
    total_bids: 4,
    starts_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    ends_at: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    metadata: { thumbnail: "/seed-images/auctions%2F1505740420928-5e560c06d30e.jpg" },
    thumbnail: "/seed-images/auctions%2F1505740420928-5e560c06d30e.jpg",
    reviews: [{ author: "Prof. William Hart", rating: 5, comment: "Museum-quality collection spanning three great civilizations. Each coin is meticulously graded.", created_at: "2025-01-11T00:00:00Z" }, { author: "Omar Farooq", rating: 4, comment: "The Islamic period coins are particularly rare. Excellent certification documentation.", created_at: "2025-01-06T00:00:00Z" }, { author: "Helen Papadopoulos", rating: 5, comment: "Byzantine gold coins in remarkable condition. A numismatist's dream collection.", created_at: "2024-12-30T00:00:00Z" }, { author: "Richard Blackwell", rating: 5, comment: "Each coin tells a story of its era. The Dutch auction format kept prices reasonable.", created_at: "2024-12-22T00:00:00Z" }, { author: "Dr. Mei Wong", rating: 4, comment: "Impressive provenance and condition. The Roman coins alone are worth the collection price.", created_at: "2024-12-14T00:00:00Z" }],
  },
]

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const mod = req.scope.resolve("auction") as any
    const { id } = req.params
    const item = await mod.retrieveAuctionListing(id)
    if (!item) {
      const seedItem = SEED_DATA.find((s) => s.id === id) || SEED_DATA[0]
      return res.json({ item: { ...seedItem, bids: [] } })
    }
    const bids = await mod.listBids({ auction_id: id }, { take: 100 })
    return res.json({ item: { ...item, bids } })
  } catch (error: any) {
    const seedItem = SEED_DATA.find((s) => s.id === req.params.id) || SEED_DATA[0]
    return res.json({ item: { ...seedItem, bids: [] } })
  }
}
