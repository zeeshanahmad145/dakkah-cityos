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
  auctions: "auctions%2F1523170335258-f5ed11844a49.jpg",
  automotive: "automotive%2F1568844239861-cb786aa3c070.jpg",
  b2b: "b2b%2F1454165804606-c3d57bc86b40.jpg",
  bookings: "bookings%2F1519167758481-83f550bb49b3.jpg",
  bundles: "bundles%2F1504674900247-0877df9cc836.jpg",
  campaigns: "campaigns%2F1503676260728-1c00da094a0b.jpg",
  charity: "charity%2F1532629345422-7515f3d16bb6.jpg",
  classifieds: "classifieds%2F1592750475338-74b7b21085ab.jpg",
  consignments: "consignments%2F1567401893414-76b7b1e5a7a5.jpg",
  credit: "credit%2F1559526324-4b87b5e36e44.jpg",
  crowdfunding: "crowdfunding%2F1559526324-4b87b5e36e44.jpg",
  "digital-products": "digital-products%2F1519389950473-47ba0277781c.jpg",
  dropshipping: "dropshipping-marketplace%2F1553062407-98d2a7e0b94b.jpg",
  education: "education%2F1552664730-d307ca884978.jpg",
  events: "events%2F1540575467063-178a2e1fce56.jpg",
  "event-ticketing": "event-ticketing%2F1488646953014-85cb44e25828.jpg",
  "financial-products": "financial-products%2F1559526324-4b87b5e36e44.jpg",
  fitness: "fitness%2F1518611012118-696072aa579a.jpg",
  "flash-deals": "flash-sales%2F1495474472287-4d71bcdd2085.jpg",
  "flash-sales": "flash-sales%2F1495474472287-4d71bcdd2085.jpg",
  freelance: "freelance%2F1522202176988-66273c2fd55f.jpg",
  "gift-cards": "gift-cards%2F1549465220-1a8b9a2e7bce.jpg",
  gigs: "gigs%2F1504384308620-19400d9df8c3.jpg",
  government: "government%2F1555431189-0d018d7e57e2.jpg",
  grocery: "grocery%2F1542838132-92c53300491e.jpg",
  healthcare: "healthcare%2F1576091160399-112ba8d25d1d.jpg",
  insurance: "insurance%2F1491438590914-bc09fcaaf77a.jpg",
  legal: "legal%2F1505664194888-1addece7eae1.jpg",
  loyalty: "loyalty%2F1563013544-824ae1b704d3.jpg",
  memberships: "memberships%2F1441986300917-64674bd600d8.jpg",
  newsletters: "newsletters%2F1557200134-90327ee9fafa.jpg",
  parking: "parking%2F1573348722427-f1d6819fdf98.jpg",
  "pet-services": "pet-services%2F1548199973-afb7da18e4c9.jpg",
  "print-on-demand": "print-on-demand-shop%2F1513364776144-60967b0f800f.jpg",
  "real-estate": "real-estate%2F1560448204-e02f11c3d0e2.jpg",
  rentals: "rentals%2F1580587771525-78b9dba3b914.jpg",
  restaurants: "restaurants%2F1555396273-367ea4eb4db5.jpg",
  "social-commerce": "social-commerce%2F1547887538-e3a2f32cb1cc.jpg",
  subscriptions: "subscriptions%2F1477959858617-67f85cf4f1df.jpg",
  "trade-in": "trade-in%2F1563013544-824ae1b704d3.jpg",
  "trade-ins": "trade-in%2F1563013544-824ae1b704d3.jpg",
  travel: "travel%2F1507525428034-b723cf961d3e.jpg",
  "try-before-you-buy": "try-before-you-buy%2F1483985988355-763728e1935b.jpg",
  utilities: "utilities%2F1558618666-fcd25c85f1d7.jpg",
  vehicles: "vehicles%2F1568844239861-cb786aa3c070.jpg",
  vendors: "vendors%2F1556742049-0cfed4f6a45d.jpg",
  "volume-deals": "volume-deals%2F1486406146926-c627a92ad1ab.jpg",
  warranties: "warranties%2F1506784983877-45594efa4cbe.jpg",
  "white-label": "white-label%2F1557200134-90327ee9fafa.jpg",
  advertising: "advertising%2F1504384308620-19400d9df8c3.jpg",
  affiliate: "affiliate%2F1563013544-824ae1b704d3.jpg",
}

export function enrichDetailItem(item: any, module: string): any {
  if (!item) return item

  let meta: any = {}
  try {
    meta = typeof item.metadata === "string" ? JSON.parse(item.metadata) : (item.metadata || {})
  } catch (_e) {
    meta = {}
  }
  const fallbackImg = CATEGORY_IMAGES[module] || CATEGORY_IMAGES["default"] || "content%2F1586724237569-f3d0c1dee8c6.jpg"

  return {
    ...item,
    thumbnail: item.thumbnail || item.logo_url || item.banner_url || item.image_url || meta.thumbnail || `/seed-images/${fallbackImg}`,
    images: item.images || meta.images || [item.thumbnail || item.logo_url || item.banner_url || item.image_url || meta.thumbnail || `/seed-images/${fallbackImg}`],
    reviews: item.reviews?.length ? item.reviews : (DEFAULT_REVIEWS[module] || DEFAULT_REVIEWS.default),
  }
}
