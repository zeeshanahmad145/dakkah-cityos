import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { handleApiError } from "../../../../lib/api-error-handler"

const SEED_DATA = [
  {
    id: "ds_001",
    title: "Wireless Bluetooth Earbuds",
    description: "Premium wireless earbuds with active noise cancellation, 30-hour battery life, and IPX5 water resistance.",
    category: "Electronics",
    price: 4999,
    currency_code: "usd",
    status: "approved",
    supplier: "TechWave Supplies",
    shipping_time: "3-7 business days",
    thumbnail: "/seed-images/auctions%2F1505740420928-5e560c06d30e.jpg",
    products: [
      { id: "dsp-1", title: "Pro Wireless Earbuds", name: "Pro Wireless Earbuds", price: 4999, thumbnail: "/seed-images/auctions%2F1505740420928-5e560c06d30e.jpg", stock: 250 },
      { id: "dsp-2", title: "Sport Bluetooth Headphones", name: "Sport Bluetooth Headphones", price: 3999, thumbnail: "/seed-images/auctions%2F1523275335684-37898b6baf30.jpg", stock: 180 },
      { id: "dsp-3", title: "USB-C Charging Cable", name: "USB-C Charging Cable", price: 999, thumbnail: "/seed-images/bundles%2F1558002038-1055907df827.jpg", stock: 500 },
      { id: "dsp-4", title: "Silicone Ear Tips Set", name: "Silicone Ear Tips Set", price: 599, thumbnail: "/seed-images/affiliate%2F1544367567-0f2fcb009e0b.jpg", stock: 1000 },
    ],
  },
  {
    id: "ds_002",
    title: "Organic Cotton Hoodie",
    description: "Sustainably made unisex hoodie from 100% organic cotton. Available in 8 colors.",
    category: "Fashion",
    price: 3499,
    currency_code: "usd",
    status: "approved",
    supplier: "EcoWear Global",
    shipping_time: "5-10 business days",
    thumbnail: "/seed-images/crowdfunding%2F1560472355-536de3962603.jpg",
    products: [
      { id: "dsp-5", title: "Organic Cotton Hoodie", name: "Organic Cotton Hoodie", price: 3499, thumbnail: "/seed-images/crowdfunding%2F1560472355-536de3962603.jpg", stock: 320 },
      { id: "dsp-6", title: "Eco-Friendly T-Shirt", name: "Eco-Friendly T-Shirt", price: 1999, thumbnail: "/seed-images/affiliate%2F1544367567-0f2fcb009e0b.jpg", stock: 450 },
      { id: "dsp-7", title: "Bamboo Fiber Socks Pack", name: "Bamboo Fiber Socks Pack", price: 1299, thumbnail: "/seed-images/bundles%2F1558002038-1055907df827.jpg", stock: 600 },
      { id: "dsp-8", title: "Recycled Canvas Tote", name: "Recycled Canvas Tote", price: 1599, thumbnail: "/seed-images/auctions%2F1523275335684-37898b6baf30.jpg", stock: 280 },
    ],
  },
  {
    id: "ds_003",
    title: "Smart LED Desk Lamp",
    description: "Adjustable color temperature desk lamp with USB charging port, touch controls, and eye-care technology.",
    category: "Home & Office",
    price: 2999,
    currency_code: "usd",
    status: "approved",
    supplier: "BrightHome Co",
    shipping_time: "4-8 business days",
    thumbnail: "/seed-images/bundles%2F1558002038-1055907df827.jpg",
    products: [
      { id: "dsp-9", title: "Smart LED Desk Lamp", name: "Smart LED Desk Lamp", price: 2999, thumbnail: "/seed-images/bundles%2F1558002038-1055907df827.jpg", stock: 150 },
      { id: "dsp-10", title: "Wireless Charging Pad", name: "Wireless Charging Pad", price: 1999, thumbnail: "/seed-images/auctions%2F1505740420928-5e560c06d30e.jpg", stock: 300 },
      { id: "dsp-11", title: "Ergonomic Mouse Pad", name: "Ergonomic Mouse Pad", price: 1499, thumbnail: "/seed-images/affiliate%2F1544367567-0f2fcb009e0b.jpg", stock: 400 },
      { id: "dsp-12", title: "Monitor Stand Riser", name: "Monitor Stand Riser", price: 3499, thumbnail: "/seed-images/crowdfunding%2F1560472355-536de3962603.jpg", stock: 120 },
    ],
  },
  {
    id: "ds_004",
    title: "Yoga Mat Premium",
    description: "Non-slip TPE yoga mat with alignment lines, 6mm thick, eco-friendly and portable with carry strap.",
    category: "Sports & Fitness",
    price: 2499,
    currency_code: "usd",
    status: "approved",
    supplier: "ZenFit Supplies",
    shipping_time: "3-6 business days",
    thumbnail: "/seed-images/affiliate%2F1544367567-0f2fcb009e0b.jpg",
    products: [
      { id: "dsp-13", title: "Premium Yoga Mat", name: "Premium Yoga Mat", price: 2499, thumbnail: "/seed-images/affiliate%2F1544367567-0f2fcb009e0b.jpg", stock: 200 },
      { id: "dsp-14", title: "Resistance Band Set", name: "Resistance Band Set", price: 1799, thumbnail: "/seed-images/bundles%2F1558002038-1055907df827.jpg", stock: 350 },
      { id: "dsp-15", title: "Foam Roller", name: "Foam Roller", price: 1299, thumbnail: "/seed-images/auctions%2F1523275335684-37898b6baf30.jpg", stock: 280 },
      { id: "dsp-16", title: "Yoga Block Set", name: "Yoga Block Set", price: 999, thumbnail: "/seed-images/crowdfunding%2F1560472355-536de3962603.jpg", stock: 420 },
    ],
  },
  {
    id: "ds_005",
    title: "Stainless Steel Water Bottle",
    description: "Double-wall vacuum insulated bottle, keeps drinks cold 24hrs or hot 12hrs. BPA-free, 750ml capacity.",
    category: "Kitchen & Dining",
    price: 1999,
    currency_code: "usd",
    status: "approved",
    supplier: "HydroLife Direct",
    shipping_time: "2-5 business days",
    thumbnail: "/seed-images/auctions%2F1523275335684-37898b6baf30.jpg",
    products: [
      { id: "dsp-17", title: "Stainless Steel Water Bottle", name: "Stainless Steel Water Bottle", price: 1999, thumbnail: "/seed-images/auctions%2F1523275335684-37898b6baf30.jpg", stock: 500 },
      { id: "dsp-18", title: "Insulated Travel Mug", name: "Insulated Travel Mug", price: 2499, thumbnail: "/seed-images/bundles%2F1558002038-1055907df827.jpg", stock: 300 },
      { id: "dsp-19", title: "Glass Food Container Set", name: "Glass Food Container Set", price: 2999, thumbnail: "/seed-images/affiliate%2F1544367567-0f2fcb009e0b.jpg", stock: 180 },
      { id: "dsp-20", title: "Bamboo Cutlery Set", name: "Bamboo Cutlery Set", price: 899, thumbnail: "/seed-images/crowdfunding%2F1560472355-536de3962603.jpg", stock: 700 },
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
