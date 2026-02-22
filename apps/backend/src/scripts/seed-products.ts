// @ts-nocheck
import { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import { createProductsWorkflow } from "@medusajs/medusa/core-flows"

const PRODUCTS = [
  {
    title: "Premium Wireless Earbuds",
    handle: "premium-wireless-earbuds",
    description: "High-quality wireless earbuds with active noise cancellation, 30-hour battery life, and crystal-clear sound.",
    status: "published",
    category_handle: "audio",
    options: [{ title: "Color", values: ["Black", "White", "Navy"] }],
    variants: [
      { title: "Black", sku: "EARBUDS-BLK", options: { Color: "Black" }, manage_inventory: false, prices: [{ amount: 299, currency_code: "sar" }, { amount: 79, currency_code: "usd" }] },
      { title: "White", sku: "EARBUDS-WHT", options: { Color: "White" }, manage_inventory: false, prices: [{ amount: 299, currency_code: "sar" }, { amount: 79, currency_code: "usd" }] },
      { title: "Navy", sku: "EARBUDS-NVY", options: { Color: "Navy" }, manage_inventory: false, prices: [{ amount: 329, currency_code: "sar" }, { amount: 89, currency_code: "usd" }] },
    ],
  },
  {
    title: "Smart Fitness Watch Pro",
    handle: "smart-fitness-watch-pro",
    description: "Advanced fitness tracking with GPS, heart rate monitor, sleep analysis, and 7-day battery life.",
    status: "published",
    category_handle: "wearables",
    options: [{ title: "Size", values: ["40mm", "44mm"] }],
    variants: [
      { title: "40mm", sku: "WATCH-40", options: { Size: "40mm" }, manage_inventory: false, prices: [{ amount: 899, currency_code: "sar" }, { amount: 249, currency_code: "usd" }] },
      { title: "44mm", sku: "WATCH-44", options: { Size: "44mm" }, manage_inventory: false, prices: [{ amount: 999, currency_code: "sar" }, { amount: 279, currency_code: "usd" }] },
    ],
  },
  {
    title: "Organic Arabic Coffee Blend",
    handle: "organic-arabic-coffee-blend",
    description: "Premium 100% Arabica beans sourced from Yemen highlands, medium roast with cardamom notes.",
    status: "published",
    category_handle: "food-beverages",
    options: [{ title: "Weight", values: ["250g", "500g", "1kg"] }],
    variants: [
      { title: "250g", sku: "COFFEE-250", options: { Weight: "250g" }, manage_inventory: false, prices: [{ amount: 75, currency_code: "sar" }, { amount: 20, currency_code: "usd" }] },
      { title: "500g", sku: "COFFEE-500", options: { Weight: "500g" }, manage_inventory: false, prices: [{ amount: 139, currency_code: "sar" }, { amount: 37, currency_code: "usd" }] },
      { title: "1kg", sku: "COFFEE-1KG", options: { Weight: "1kg" }, manage_inventory: false, prices: [{ amount: 249, currency_code: "sar" }, { amount: 69, currency_code: "usd" }] },
    ],
  },
  {
    title: "Luxury Oud Perfume",
    handle: "luxury-oud-perfume",
    description: "Exquisite blend of agarwood oud, rose, and amber. A signature Middle Eastern fragrance.",
    status: "published",
    category_handle: "beauty-personal-care",
    options: [{ title: "Size", values: ["50ml", "100ml"] }],
    variants: [
      { title: "50ml", sku: "OUD-50", options: { Size: "50ml" }, manage_inventory: false, prices: [{ amount: 450, currency_code: "sar" }, { amount: 120, currency_code: "usd" }] },
      { title: "100ml", sku: "OUD-100", options: { Size: "100ml" }, manage_inventory: false, prices: [{ amount: 750, currency_code: "sar" }, { amount: 199, currency_code: "usd" }] },
    ],
  },
  {
    title: "Designer Leather Laptop Bag",
    handle: "designer-leather-laptop-bag",
    description: "Handcrafted genuine leather laptop bag, fits up to 15-inch laptops with multiple compartments.",
    status: "published",
    category_handle: "accessories",
    options: [{ title: "Color", values: ["Brown", "Black", "Tan"] }],
    variants: [
      { title: "Brown", sku: "BAG-BRN", options: { Color: "Brown" }, manage_inventory: false, prices: [{ amount: 599, currency_code: "sar" }, { amount: 159, currency_code: "usd" }] },
      { title: "Black", sku: "BAG-BLK2", options: { Color: "Black" }, manage_inventory: false, prices: [{ amount: 599, currency_code: "sar" }, { amount: 159, currency_code: "usd" }] },
      { title: "Tan", sku: "BAG-TAN", options: { Color: "Tan" }, manage_inventory: false, prices: [{ amount: 649, currency_code: "sar" }, { amount: 175, currency_code: "usd" }] },
    ],
  },
  {
    title: "Smart Home Hub Controller",
    handle: "smart-home-hub-controller",
    description: "Central smart home controller with voice assistant, touchscreen display, and compatibility with 500+ devices.",
    status: "published",
    category_handle: "electronics",
    options: [{ title: "Model", values: ["Standard", "Pro"] }],
    variants: [
      { title: "Standard", sku: "HUB-STD", options: { Model: "Standard" }, manage_inventory: false, prices: [{ amount: 449, currency_code: "sar" }, { amount: 119, currency_code: "usd" }] },
      { title: "Pro", sku: "HUB-PRO", options: { Model: "Pro" }, manage_inventory: false, prices: [{ amount: 699, currency_code: "sar" }, { amount: 189, currency_code: "usd" }] },
    ],
  },
  {
    title: "Mens Thobe - Premium Cotton",
    handle: "mens-thobe-premium-cotton",
    description: "Traditional Saudi thobe crafted from premium Egyptian cotton, available in classic white and cream.",
    status: "published",
    category_handle: "mens-clothing",
    options: [{ title: "Size", values: ["M", "L", "XL"] }],
    variants: [
      { title: "M", sku: "THOBE-M", options: { Size: "M" }, manage_inventory: false, prices: [{ amount: 350, currency_code: "sar" }, { amount: 95, currency_code: "usd" }] },
      { title: "L", sku: "THOBE-L", options: { Size: "L" }, manage_inventory: false, prices: [{ amount: 350, currency_code: "sar" }, { amount: 95, currency_code: "usd" }] },
      { title: "XL", sku: "THOBE-XL", options: { Size: "XL" }, manage_inventory: false, prices: [{ amount: 375, currency_code: "sar" }, { amount: 99, currency_code: "usd" }] },
    ],
  },
  {
    title: "Natural Saffron Pack",
    handle: "natural-saffron-pack",
    description: "Grade 1 Iranian saffron threads, hand-picked and sun-dried, perfect for traditional dishes and beverages.",
    status: "published",
    category_handle: "food-beverages",
    options: [{ title: "Weight", values: ["5g", "10g", "25g"] }],
    variants: [
      { title: "5g", sku: "SAFF-5G", options: { Weight: "5g" }, manage_inventory: false, prices: [{ amount: 89, currency_code: "sar" }, { amount: 25, currency_code: "usd" }] },
      { title: "10g", sku: "SAFF-10G", options: { Weight: "10g" }, manage_inventory: false, prices: [{ amount: 159, currency_code: "sar" }, { amount: 45, currency_code: "usd" }] },
      { title: "25g", sku: "SAFF-25G", options: { Weight: "25g" }, manage_inventory: false, prices: [{ amount: 359, currency_code: "sar" }, { amount: 99, currency_code: "usd" }] },
    ],
  },
]

export default async function seedProducts({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)

  try {
    const query = container.resolve(ContainerRegistrationKeys.QUERY) as any

    const { data: existingProducts } = await query.graph({
      entity: "product",
      fields: ["id"],
      pagination: { take: 1 },
    })
    if (existingProducts.length > 0) {
      logger.info("Products already exist. Skipping seed.")
      return
    }

    const { data: categories } = await query.graph({
      entity: "product_category",
      fields: ["id", "handle"],
    })
    const catMap = new Map(categories.map((c: any) => [c.handle, c.id]))

    const { data: salesChannels } = await query.graph({
      entity: "sales_channel",
      fields: ["id"],
    })

    let created = 0

    for (const p of PRODUCTS) {
      try {
        const catId = catMap.get(p.category_handle)

        const { result } = await createProductsWorkflow(container).run({
          input: {
            products: [
              {
                title: p.title,
                handle: p.handle,
                description: p.description,
                status: p.status as any,
                options: p.options,
                variants: p.variants,
                sales_channels: salesChannels.map((sc: any) => ({ id: sc.id })),
                ...(catId ? { categories: [{ id: catId }] } : {}),
              },
            ],
          } as any,
        })

        created++
        logger.info(`Created product: ${p.title} (${result[0]?.id})`)
      } catch (err: any) {
        logger.error(`Failed: ${p.title} — ${err.message}`)
      }
    }

    logger.info(`Product seeding: ${created}/${PRODUCTS.length} created`)
  } catch (err: any) {
    logger.error("Seed failed: " + err.message)
    logger.error(err.stack)
  }
}
