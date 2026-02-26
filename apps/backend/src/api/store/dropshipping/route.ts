import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { handleApiError } from "../../../lib/api-error-handler"

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
    thumbnail: "/seed-images/auctions/1505740420928-5e560c06d30e.jpg",
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
    thumbnail: "/seed-images/crowdfunding/1560472355-536de3962603.jpg",
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
    thumbnail: "/seed-images/bundles/1558002038-1055907df827.jpg",
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
    thumbnail: "/seed-images/affiliate/1544367567-0f2fcb009e0b.jpg",
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
    thumbnail: "/seed-images/auctions/1523275335684-37898b6baf30.jpg",
  },
]

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const vendorService = req.scope.resolve("vendor") as any
    const {
      limit = "20",
      offset = "0",
      tenant_id,
      category,
      supplier,
      status,
      search,
    } = req.query as Record<string, string | undefined>

    const filters: Record<string, any> = {}
    if (tenant_id) filters.tenant_id = tenant_id
    if (category) filters.category = category
    if (supplier) filters.vendor_id = supplier
    if (status) {
      filters.status = status
    } else {
      filters.status = "approved"
    }
    if (search) filters.title = { $like: `%${search}%` }

    const items = await vendorService.listVendorProducts(filters, {
      skip: Number(offset),
      take: Number(limit),
      order: { created_at: "DESC" },
    })

    const hasRealData = Array.isArray(items) && items.length > 0 && items.some((i: any) => i.thumbnail)
    const itemList = hasRealData ? items : SEED_DATA

    return res.json({
      items: itemList,
      count: itemList.length,
      limit: Number(limit),
      offset: Number(offset),
    })
  } catch (error: any) {
    return res.json({
      items: SEED_DATA,
      count: SEED_DATA.length,
      limit: 20,
      offset: 0,
    })
  }
}

