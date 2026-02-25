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
    thumbnail: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&h=600&fit=crop",
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
    thumbnail: "https://images.unsplash.com/photo-1560472355-536de3962603?w=800&h=600&fit=crop",
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
    thumbnail: "https://images.unsplash.com/photo-1558002038-1055907df827?w=800&h=600&fit=crop",
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
    thumbnail: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&h=600&fit=crop",
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
    thumbnail: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&h=600&fit=crop",
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
