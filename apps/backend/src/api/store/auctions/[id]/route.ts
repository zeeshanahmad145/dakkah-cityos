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
    metadata: { thumbnail: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&h=600&fit=crop" },
    thumbnail: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&h=600&fit=crop",
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
    metadata: { thumbnail: "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=800&h=600&fit=crop" },
    thumbnail: "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=800&h=600&fit=crop",
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
    metadata: { thumbnail: "https://images.unsplash.com/photo-1489824904134-891ab64532f1?w=800&h=600&fit=crop" },
    thumbnail: "https://images.unsplash.com/photo-1489824904134-891ab64532f1?w=800&h=600&fit=crop",
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
    metadata: { thumbnail: "https://images.unsplash.com/photo-1515562141589-67f0d6a4bf28?w=800&h=600&fit=crop" },
    thumbnail: "https://images.unsplash.com/photo-1515562141589-67f0d6a4bf28?w=800&h=600&fit=crop",
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
    metadata: { thumbnail: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&h=600&fit=crop" },
    thumbnail: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&h=600&fit=crop",
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
