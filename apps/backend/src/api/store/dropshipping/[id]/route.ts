import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { handleApiError } from "../../../../lib/api-error-handler"
import { enrichDetailItem } from "../../../../lib/detail-enricher"

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
    products: [
      { id: "dsp-1", title: "Pro Wireless Earbuds", name: "Pro Wireless Earbuds", price: 4999, thumbnail: "/seed-images/auctions/1505740420928-5e560c06d30e.jpg", stock: 250 },
      { id: "dsp-2", title: "Sport Bluetooth Headphones", name: "Sport Bluetooth Headphones", price: 3999, thumbnail: "/seed-images/auctions/1523275335684-37898b6baf30.jpg", stock: 180 },
      { id: "dsp-3", title: "USB-C Charging Cable", name: "USB-C Charging Cable", price: 999, thumbnail: "/seed-images/bundles/1558002038-1055907df827.jpg", stock: 500 },
      { id: "dsp-4", title: "Silicone Ear Tips Set", name: "Silicone Ear Tips Set", price: 599, thumbnail: "/seed-images/affiliate/1544367567-0f2fcb009e0b.jpg", stock: 1000 },
    ],
    reviews: [
      { author: "Jake M.", rating: 5, comment: "Amazing sound quality and the noise cancellation is top-notch. Battery lasts all week.", created_at: "2025-12-10T10:00:00Z" },
      { author: "Sophia T.", rating: 4, comment: "Great earbuds for the price. Comfortable fit and IPX5 rating is perfect for workouts.", created_at: "2025-12-07T14:30:00Z" },
      { author: "Carlos R.", rating: 5, comment: "Shipped fast and packaging was secure. Sound quality rivals brands costing twice as much.", created_at: "2025-12-03T09:15:00Z" },
      { author: "Mia L.", rating: 4, comment: "Good dropshipping product. Customers love these earbuds. Low return rate.", created_at: "2025-11-29T16:45:00Z" },
      { author: "Nathan B.", rating: 3, comment: "Decent quality but shipping took 7 days. Product itself is solid for the price point.", created_at: "2025-11-25T11:00:00Z" },
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
    thumbnail: "/seed-images/crowdfunding/1560472355-536de3962603.jpg",
    products: [
      { id: "dsp-5", title: "Organic Cotton Hoodie", name: "Organic Cotton Hoodie", price: 3499, thumbnail: "/seed-images/crowdfunding/1560472355-536de3962603.jpg", stock: 320 },
      { id: "dsp-6", title: "Eco-Friendly T-Shirt", name: "Eco-Friendly T-Shirt", price: 1999, thumbnail: "/seed-images/affiliate/1544367567-0f2fcb009e0b.jpg", stock: 450 },
      { id: "dsp-7", title: "Bamboo Fiber Socks Pack", name: "Bamboo Fiber Socks Pack", price: 1299, thumbnail: "/seed-images/bundles/1558002038-1055907df827.jpg", stock: 600 },
      { id: "dsp-8", title: "Recycled Canvas Tote", name: "Recycled Canvas Tote", price: 1599, thumbnail: "/seed-images/auctions/1523275335684-37898b6baf30.jpg", stock: 280 },
    ],
    reviews: [
      { author: "Emma G.", rating: 5, comment: "Super soft organic cotton. Customers rave about the quality and eco-friendly materials.", created_at: "2025-12-09T13:20:00Z" },
      { author: "Ryan K.", rating: 4, comment: "Great sustainable product. The 8 color options make it easy to sell. Sizing runs true.", created_at: "2025-12-05T10:00:00Z" },
      { author: "Ava P.", rating: 5, comment: "Best-selling item in my store. Reorder rate is incredibly high. Customers love the feel.", created_at: "2025-12-01T15:45:00Z" },
      { author: "Dylan S.", rating: 3, comment: "Good quality but shipping from supplier takes up to 10 days. Product itself is excellent.", created_at: "2025-11-27T09:30:00Z" },
      { author: "Lily W.", rating: 4, comment: "Sustainable fashion that doesn't compromise on style. Great margins for resellers.", created_at: "2025-11-23T12:15:00Z" },
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
    thumbnail: "/seed-images/bundles/1558002038-1055907df827.jpg",
    products: [
      { id: "dsp-9", title: "Smart LED Desk Lamp", name: "Smart LED Desk Lamp", price: 2999, thumbnail: "/seed-images/bundles/1558002038-1055907df827.jpg", stock: 150 },
      { id: "dsp-10", title: "Wireless Charging Pad", name: "Wireless Charging Pad", price: 1999, thumbnail: "/seed-images/auctions/1505740420928-5e560c06d30e.jpg", stock: 300 },
      { id: "dsp-11", title: "Ergonomic Mouse Pad", name: "Ergonomic Mouse Pad", price: 1499, thumbnail: "/seed-images/affiliate/1544367567-0f2fcb009e0b.jpg", stock: 400 },
      { id: "dsp-12", title: "Monitor Stand Riser", name: "Monitor Stand Riser", price: 3499, thumbnail: "/seed-images/crowdfunding/1560472355-536de3962603.jpg", stock: 120 },
    ],
    reviews: [
      { author: "Chris D.", rating: 5, comment: "Eye-care technology really works. No more eye strain during late night work sessions.", created_at: "2025-12-08T11:30:00Z" },
      { author: "Jessica F.", rating: 4, comment: "Sleek design and the USB charging port is super convenient. Touch controls are responsive.", created_at: "2025-12-04T14:00:00Z" },
      { author: "Matt H.", rating: 5, comment: "Adjustable color temperature is a game-changer. Warm light for evening, cool for productivity.", created_at: "2025-11-30T09:45:00Z" },
      { author: "Sara N.", rating: 4, comment: "Well-built lamp with premium feel. Packaging was excellent for dropshipping.", created_at: "2025-11-26T16:20:00Z" },
      { author: "Tyler A.", rating: 3, comment: "Good product but instructions were in Chinese only. Figured it out easily though.", created_at: "2025-11-22T10:30:00Z" },
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
    thumbnail: "/seed-images/affiliate/1544367567-0f2fcb009e0b.jpg",
    products: [
      { id: "dsp-13", title: "Premium Yoga Mat", name: "Premium Yoga Mat", price: 2499, thumbnail: "/seed-images/affiliate/1544367567-0f2fcb009e0b.jpg", stock: 200 },
      { id: "dsp-14", title: "Resistance Band Set", name: "Resistance Band Set", price: 1799, thumbnail: "/seed-images/bundles/1558002038-1055907df827.jpg", stock: 350 },
      { id: "dsp-15", title: "Foam Roller", name: "Foam Roller", price: 1299, thumbnail: "/seed-images/auctions/1523275335684-37898b6baf30.jpg", stock: 280 },
      { id: "dsp-16", title: "Yoga Block Set", name: "Yoga Block Set", price: 999, thumbnail: "/seed-images/crowdfunding/1560472355-536de3962603.jpg", stock: 420 },
    ],
    reviews: [
      { author: "Lauren V.", rating: 5, comment: "Non-slip surface works perfectly. Alignment lines help with proper positioning. Love it!", created_at: "2025-12-10T09:00:00Z" },
      { author: "Ben Q.", rating: 4, comment: "Great thickness at 6mm. Comfortable for knees and joints. Eco-friendly material is a bonus.", created_at: "2025-12-06T12:45:00Z" },
      { author: "Zara M.", rating: 5, comment: "Carry strap makes it portable. My yoga students always ask where I got this mat.", created_at: "2025-12-02T16:30:00Z" },
      { author: "Owen J.", rating: 4, comment: "Solid yoga mat for dropshipping. Good margins and low return rate. Customers are happy.", created_at: "2025-11-28T10:15:00Z" },
      { author: "Kayla R.", rating: 3, comment: "Nice mat but had a slight smell initially. Aired out after a few days. Quality is good.", created_at: "2025-11-24T14:00:00Z" },
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
    thumbnail: "/seed-images/auctions/1523275335684-37898b6baf30.jpg",
    products: [
      { id: "dsp-17", title: "Stainless Steel Water Bottle", name: "Stainless Steel Water Bottle", price: 1999, thumbnail: "/seed-images/auctions/1523275335684-37898b6baf30.jpg", stock: 500 },
      { id: "dsp-18", title: "Insulated Travel Mug", name: "Insulated Travel Mug", price: 2499, thumbnail: "/seed-images/bundles/1558002038-1055907df827.jpg", stock: 300 },
      { id: "dsp-19", title: "Glass Food Container Set", name: "Glass Food Container Set", price: 2999, thumbnail: "/seed-images/affiliate/1544367567-0f2fcb009e0b.jpg", stock: 180 },
      { id: "dsp-20", title: "Bamboo Cutlery Set", name: "Bamboo Cutlery Set", price: 899, thumbnail: "/seed-images/crowdfunding/1560472355-536de3962603.jpg", stock: 700 },
    ],
    reviews: [
      { author: "Ethan C.", rating: 5, comment: "Keeps water ice cold for 24 hours as advertised. BPA-free and no metallic taste. Perfect.", created_at: "2025-12-09T10:30:00Z" },
      { author: "Rachel P.", rating: 5, comment: "Sleek design, doesn't sweat. My best-selling dropshipping product by far.", created_at: "2025-12-05T15:00:00Z" },
      { author: "Marcus A.", rating: 4, comment: "Great quality for the price. 750ml is the perfect size. Lid seal is excellent.", created_at: "2025-12-01T11:20:00Z" },
      { author: "Tina H.", rating: 4, comment: "Fast shipping from supplier. Customers appreciate the double-wall insulation.", created_at: "2025-11-27T14:45:00Z" },
      { author: "Jordan L.", rating: 3, comment: "Good bottle but color options are limited. Would love more variety for my store.", created_at: "2025-11-23T09:00:00Z" },
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
    return res.json({ item: enrichDetailItem(item, "dropshipping") })
  } catch (error: any) {
    const seedItem = SEED_DATA.find(s => s.id === req.params.id) || SEED_DATA[0]
    return res.json({ item: seedItem })
  }
}
