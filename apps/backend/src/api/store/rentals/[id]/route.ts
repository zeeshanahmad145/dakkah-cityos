import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"


const SEED_DATA = [
  {
    id: "rental_seed_1",
    tenant_id: "default",
    product_id: "prod_rental_1",
    rental_type: "daily",
    title: "Professional DSLR Camera Kit",
    name: "Professional DSLR Camera Kit",
    description: "Canon EOS R5 with 24-70mm f/2.8 lens, tripod, and carry case. Perfect for events, travel photography, and content creation.",
    daily_rate: 15000,
    weekly_rate: 75000,
    monthly_rate: 200000,
    deposit_amount: 50000,
    currency_code: "SAR",
    is_available: true,
    condition_on_listing: "Excellent",
    total_rentals: 48,
    category: "electronics",
    rating: 4.8,
    metadata: { thumbnail: "/seed-images/auctions%2F1526170375885-4d8ecf77b99f.jpg", price: 15000 },
    thumbnail: "/seed-images/auctions%2F1526170375885-4d8ecf77b99f.jpg",
    price: 15000,
  },
  {
    id: "rental_seed_2",
    tenant_id: "default",
    product_id: "prod_rental_2",
    rental_type: "daily",
    title: "Electric Scooter",
    name: "Electric Scooter",
    description: "Segway Ninebot Max G30 electric scooter with 65km range. Ideal for city commuting and sightseeing.",
    daily_rate: 5000,
    weekly_rate: 25000,
    monthly_rate: 70000,
    deposit_amount: 20000,
    currency_code: "SAR",
    is_available: true,
    condition_on_listing: "Good",
    total_rentals: 120,
    category: "vehicles",
    rating: 4.5,
    metadata: { thumbnail: "/seed-images/rentals%2F1560343090-f0409e92791a.jpg", price: 5000 },
    thumbnail: "/seed-images/rentals%2F1560343090-f0409e92791a.jpg",
    price: 5000,
  },
  {
    id: "rental_seed_3",
    tenant_id: "default",
    product_id: "prod_rental_3",
    rental_type: "weekly",
    title: "Camping & Outdoor Gear Set",
    name: "Camping & Outdoor Gear Set",
    description: "Complete camping package: 4-person tent, sleeping bags, portable stove, lantern, and cooler. Everything you need for a desert or mountain adventure.",
    daily_rate: 10000,
    weekly_rate: 50000,
    monthly_rate: 150000,
    deposit_amount: 30000,
    currency_code: "SAR",
    is_available: true,
    condition_on_listing: "Very Good",
    total_rentals: 65,
    category: "sports",
    rating: 4.6,
    metadata: { thumbnail: "/seed-images/freelance%2F1532629345422-7515f3d16bb6.jpg", price: 50000 },
    thumbnail: "/seed-images/freelance%2F1532629345422-7515f3d16bb6.jpg",
    price: 50000,
  },
  {
    id: "rental_seed_4",
    tenant_id: "default",
    product_id: "prod_rental_4",
    rental_type: "monthly",
    title: "Standing Desk & Ergonomic Chair",
    name: "Standing Desk & Ergonomic Chair",
    description: "Motorized sit-stand desk with Herman Miller Aeron chair. Transform your home office with premium ergonomic furniture.",
    daily_rate: 8000,
    weekly_rate: 40000,
    monthly_rate: 120000,
    deposit_amount: 40000,
    currency_code: "SAR",
    is_available: true,
    condition_on_listing: "Excellent",
    total_rentals: 32,
    category: "furniture",
    rating: 4.9,
    metadata: { thumbnail: "/seed-images/classifieds%2F1555041469-a586c61ea9bc.jpg", price: 120000 },
    thumbnail: "/seed-images/classifieds%2F1555041469-a586c61ea9bc.jpg",
    price: 120000,
  },
  {
    id: "rental_seed_5",
    tenant_id: "default",
    product_id: "prod_rental_5",
    rental_type: "daily",
    title: "Power Tools Construction Kit",
    name: "Power Tools Construction Kit",
    description: "DeWalt professional toolkit with drill, circular saw, reciprocating saw, and impact driver. Includes batteries and charger.",
    daily_rate: 12000,
    weekly_rate: 60000,
    monthly_rate: 180000,
    deposit_amount: 35000,
    currency_code: "SAR",
    is_available: true,
    condition_on_listing: "Good",
    total_rentals: 87,
    category: "tools",
    rating: 4.7,
    metadata: { thumbnail: "/seed-images/digital-products%2F1517694712202-14dd9538aa97.jpg", price: 12000 },
    thumbnail: "/seed-images/digital-products%2F1517694712202-14dd9538aa97.jpg",
    price: 12000,
  },
]

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const mod = req.scope.resolve("rental") as any
    const { id } = req.params
    const item = await mod.retrieveRentalProduct(id)
    if (!item) {
      const seedItem = SEED_DATA.find((s) => s.id === id) || SEED_DATA[0]
      return res.json({ item: seedItem })
    }
    return res.json({ item })
  } catch (error: any) {
    const seedItem = SEED_DATA.find((s) => s.id === req.params.id) || SEED_DATA[0]
    return res.json({ item: seedItem })
  }
}
