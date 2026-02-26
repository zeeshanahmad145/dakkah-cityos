const DEFAULT_REVIEWS: Record<string, Array<{ author: string; rating: number; comment: string; created_at: string }>> = {
  default: [
    { author: "Mohammed A.", rating: 5, comment: "Exceptional quality and service. Highly recommend.", created_at: "2025-01-15T00:00:00Z" },
    { author: "Sara K.", rating: 5, comment: "Exactly what I was looking for. Great experience overall.", created_at: "2025-01-12T00:00:00Z" },
    { author: "Khalid R.", rating: 4, comment: "Very good value. Would definitely use again.", created_at: "2025-01-10T00:00:00Z" },
    { author: "Fatima Z.", rating: 5, comment: "Smooth process from start to finish. Exceeded expectations.", created_at: "2025-01-08T00:00:00Z" },
    { author: "Ahmed F.", rating: 4, comment: "Solid offering. Minor improvements possible but overall great.", created_at: "2025-01-05T00:00:00Z" },
  ],
}

const CATEGORY_IMAGES: Record<string, string> = {
  auctions: "auctions/1523170335258-f5ed11844a49.jpg",
  automotive: "automotive/1568844239861-cb786aa3c070.jpg",
  b2b: "b2b/1454165804606-c3d57bc86b40.jpg",
  bookings: "bookings/1519167758481-83f550bb49b3.jpg",
  bundles: "bundles/1504674900247-0877df9cc836.jpg",
  campaigns: "campaigns/1503676260728-1c00da094a0b.jpg",
  charity: "charity/1532629345422-7515f3d16bb6.jpg",
  classifieds: "classifieds/1592750475338-74b7b21085ab.jpg",
  consignments: "consignments/1567401893414-76b7b1e5a7a5.jpg",
  credit: "credit/1559526324-4b87b5e36e44.jpg",
  crowdfunding: "crowdfunding/1559526324-4b87b5e36e44.jpg",
  "digital-products": "digital-products/1519389950473-47ba0277781c.jpg",
  dropshipping: "dropshipping-marketplace/1553062407-98d2a7e0b94b.jpg",
  education: "education/1552664730-d307ca884978.jpg",
  events: "events/1540575467063-178a2e1fce56.jpg",
  "event-ticketing": "event-ticketing/1488646953014-85cb44e25828.jpg",
  "financial-products": "financial-products/1559526324-4b87b5e36e44.jpg",
  fitness: "fitness/1518611012118-696072aa579a.jpg",
  "flash-deals": "flash-sales/1495474472287-4d71bcdd2085.jpg",
  "flash-sales": "flash-sales/1495474472287-4d71bcdd2085.jpg",
  freelance: "freelance/1522202176988-66273c2fd55f.jpg",
  "gift-cards": "gift-cards/1549465220-1a8b9a2e7bce.jpg",
  gigs: "gigs/1504384308620-19400d9df8c3.jpg",
  government: "government/1555431189-0d018d7e57e2.jpg",
  grocery: "grocery/1542838132-92c53300491e.jpg",
  healthcare: "healthcare/1576091160399-112ba8d25d1d.jpg",
  insurance: "insurance/1491438590914-bc09fcaaf77a.jpg",
  legal: "legal/1505664194888-1addece7eae1.jpg",
  loyalty: "loyalty/1563013544-824ae1b704d3.jpg",
  memberships: "memberships/1441986300917-64674bd600d8.jpg",
  newsletters: "newsletters/1557200134-90327ee9fafa.jpg",
  parking: "parking/1573348722427-f1d6819fdf98.jpg",
  "pet-services": "pet-services/1548199973-afb7da18e4c9.jpg",
  "print-on-demand": "print-on-demand-shop/1513364776144-60967b0f800f.jpg",
  "real-estate": "real-estate/1560448204-e02f11c3d0e2.jpg",
  rentals: "rentals/1580587771525-78b9dba3b914.jpg",
  restaurants: "restaurants/1555396273-367ea4eb4db5.jpg",
  "social-commerce": "social-commerce/1547887538-e3a2f32cb1cc.jpg",
  subscriptions: "subscriptions/1477959858617-67f85cf4f1df.jpg",
  "trade-in": "trade-in/1563013544-824ae1b704d3.jpg",
  "trade-ins": "trade-in/1563013544-824ae1b704d3.jpg",
  travel: "travel/1507525428034-b723cf961d3e.jpg",
  "try-before-you-buy": "try-before-you-buy/1483985988355-763728e1935b.jpg",
  utilities: "utilities/1558618666-fcd25c85f1d7.jpg",
  vehicles: "vehicles/1568844239861-cb786aa3c070.jpg",
  vendors: "vendors/1556742049-0cfed4f6a45d.jpg",
  "volume-deals": "volume-deals/1486406146926-c627a92ad1ab.jpg",
  warranties: "warranties/1506784983877-45594efa4cbe.jpg",
  "white-label": "white-label/1557200134-90327ee9fafa.jpg",
  advertising: "advertising/1504384308620-19400d9df8c3.jpg",
  affiliate: "affiliate/1563013544-824ae1b704d3.jpg",
  affiliates: "affiliate/1563013544-824ae1b704d3.jpg",
  companies: "b2b/1454165804606-c3d57bc86b40.jpg",
  places: "events/1459749411175-04bf5292ceea.jpg",
  wishlists: "content/1586724237569-f3d0c1dee8c6.jpg",
}

const VALID_IMAGES: Record<string, string[]> = {
  automotive: ["1556189250-72ba954cfc2b.jpg","1568605117036-5fe5e7bab0b7.jpg","1618843479313-40f8afb4b4d8.jpg","1621993202323-f438eec934ff.jpg","1632245889029-e406faaa34cd.jpg"],
  education: ["1552664730-d307ca884978.jpg"],
  "digital-products": ["1506744038136-46273834b3fb.jpg","1517694712202-14dd9538aa97.jpg","1544716278-ca5e3f4abd8c.jpg","1545235617-9465d2a55698.jpg"],
  "event-ticketing": ["1488646953014-85cb44e25828.jpg","1507525428034-b723cf961d3e.jpg"],
  freelance: ["1455390582262-044cdead277a.jpg","1461749280684-dccba630e2f6.jpg","1498050108023-c5249f4df085.jpg","1532094349884-543bc11b234d.jpg","1532629345422-7515f3d16bb6.jpg","1574717024653-61fd2cf4d44d.jpg","1626785774573-4b799315345d.jpg"],
  gigs: ["1461749280684-dccba630e2f6.jpg","1498050108023-c5249f4df085.jpg","1532094349884-543bc11b234d.jpg","1532629345422-7515f3d16bb6.jpg","1574717024653-61fd2cf4d44d.jpg"],
  healthcare: ["1551836022-d5d88e9218df.jpg","1576091160399-112ba8d25d1d.jpg","1612349317150-e413f6a5b16d.jpg","1622253692010-333f2da6031d.jpg"],
  "real-estate": ["1502672260266-1c1ef2d93688.jpg","1512917774080-9991f1c4c750.jpg","1545324418-cc1a3fa10c00.jpg","1600585154340-be6161a56a0c.jpg","1600596542815-ffad4c1539a9.jpg","1613490493576-7fde63acd811.jpg"],
  rentals: ["1504148455328-c376907d081c.jpg","1504280390367-361c6d9f38f4.jpg","1516035069371-29a1b244cc32.jpg","1560343090-f0409e92791a.jpg"],
  auctions: ["1489824904134-891ab64532f1.jpg","1505740420928-5e560c06d30e.jpg","1523170335258-f5ed11844a49.jpg","1523275335684-37898b6baf30.jpg","1526170375885-4d8ecf77b99f.jpg"],
  bookings: ["1506126613408-eca07ce68773.jpg","1520340356584-f9917d1eea6f.jpg","1534438327276-14e5300c3a48.jpg","1542038784456-1ea8e935640e.jpg"],
  events: ["1459749411175-04bf5292ceea.jpg","1501281668745-f7f57925c3b4.jpg","1505373877841-8d25f7d46678.jpg","1511578314322-379afb476865.jpg"],
}


export function enrichListItems(items: any[], module: string): any[] {
  const categoryKey = module === "education" ? "digital-products" : module
  const fallbackImg = CATEGORY_IMAGES[categoryKey] || CATEGORY_IMAGES[module] || CATEGORY_IMAGES["default"] || "content/1586724237569-f3d0c1dee8c6.jpg"
  const validImages = VALID_IMAGES[categoryKey] || VALID_IMAGES[module]
  const imgDir = fallbackImg.split("/")[0]

  return items.map((item, idx) => {
    if (item.thumbnail) {
      const normalized = normalizeThumbnail(item.thumbnail) || item.thumbnail
      const fname = normalized.split("/").pop() || ""
      if (validImages && !validImages.includes(fname)) {
        const assignedImg = validImages[idx % validImages.length]
        return { ...item, thumbnail: `/seed-images/${imgDir}/${assignedImg}` }
      }
      return { ...item, thumbnail: normalized }
    }
    let meta: any = {}
    try {
      meta = typeof item.metadata === "string" ? JSON.parse(item.metadata) : (item.metadata || {})
    } catch (_e) {}

    const metaThumb = meta.thumbnail
    if (metaThumb && validImages) {
      const fname = metaThumb.split("%2F").pop()?.split("/").pop() || ""
      if (validImages.includes(fname)) {
        const normalized = metaThumb.replace(/%2F/g, "/")
        return { ...item, thumbnail: normalized }
      }
    }

    if (validImages) {
      const assignedImg = validImages[idx % validImages.length]
      return { ...item, thumbnail: `/seed-images/${imgDir}/${assignedImg}` }
    }
    return {
      ...item,
      thumbnail: item.image_url || item.banner_url || item.logo_url || item.photo_url || item.thumbnail_url || `/seed-images/${fallbackImg}`,
    }
  })
}

export function normalizeThumbnail(thumb: string | null | undefined): string | null {
  if (!thumb) return null
  return thumb.replace(/%2F/gi, "/")
}

export function enrichDetailItem(item: any, module: string): any {
  if (!item) return item

  let meta: any = {}
  try {
    meta = typeof item.metadata === "string" ? JSON.parse(item.metadata) : (item.metadata || {})
  } catch (_e) {
    meta = {}
  }
  const fallbackImg = CATEGORY_IMAGES[module] || CATEGORY_IMAGES["default"] || "content/1586724237569-f3d0c1dee8c6.jpg"
  const thumb = normalizeThumbnail(item.thumbnail || item.logo_url || item.banner_url || item.image_url || meta.thumbnail) || `/seed-images/${fallbackImg}`

  return {
    ...item,
    thumbnail: thumb,
    images: item.images || meta.images || [thumb],
    reviews: item.reviews?.length ? item.reviews : (DEFAULT_REVIEWS[module] || DEFAULT_REVIEWS.default),
  }
}
