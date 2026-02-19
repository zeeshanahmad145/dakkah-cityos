// @ts-nocheck
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { z } from "zod"
import { handleApiError } from "../../../../lib/api-error-handler"

const updateVendorProductSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  vendor_sku: z.string().optional(),
  vendor_cost: z.number().optional(),
  inventory_quantity: z.number().optional(),
  variants: z.array(z.record(z.string(), z.unknown())).optional(),
  images: z.array(z.record(z.string(), z.unknown())).optional(),
}).passthrough()

// GET /vendor/products/:productId - Get vendor product details
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const vendorId = (req as any).vendor_id
  if (!vendorId) {
    return res.status(401).json({ message: "Vendor authentication required" })
  }

  const { productId } = req.params
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data: vendorProducts } = await query.graph({
    entity: "vendor_product",
    fields: [
      "id",
      "vendor_id",
      "product_id",
      "is_primary_vendor",
      "vendor_sku",
      "vendor_cost",
      "commission_override",
      "status",
      "inventory_quantity",
      "created_at",
      "product.*",
      "product.variants.*",
      "product.options.*",
      "product.images.*",
    ],
    filters: {
      id: productId,
      vendor_id: vendorId,
    },
  })

  if (!vendorProducts.length) {
    return res.status(404).json({ message: "Product not found" })
  }

  const vp = vendorProducts[0]
  res.json({
    product: {
      id: vp.id,
      product_id: vp.product_id,
      vendor_sku: vp.vendor_sku,
      vendor_cost: vp.vendor_cost,
      commission_override: vp.commission_override,
      status: vp.status,
      inventory_quantity: vp.inventory_quantity,
      is_primary_vendor: vp.is_primary_vendor,
      title: vp.product?.title,
      description: vp.product?.description,
      handle: vp.product?.handle,
      thumbnail: vp.product?.thumbnail,
      variants: vp.product?.variants || [],
      options: vp.product?.options || [],
      images: vp.product?.images || [],
      created_at: vp.created_at,
    }
  })
}

// PUT /vendor/products/:productId - Update vendor product
export async function PUT(req: MedusaRequest, res: MedusaResponse) {
  const vendorId = (req as any).vendor_id
  if (!vendorId) {
    return res.status(401).json({ message: "Vendor authentication required" })
  }

  const { productId } = req.params

  const parsed = updateVendorProductSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ message: "Validation failed", errors: parsed.error.issues })
  }

  const { 
    title, 
    description, 
    vendor_sku,
    vendor_cost,
    inventory_quantity,
    variants,
    images,
  } = parsed.data

  const vendorModule = req.scope.resolve("vendor")
  const productModule = req.scope.resolve("product")
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  // Verify ownership
  const { data: vendorProducts } = await query.graph({
    entity: "vendor_product",
    fields: ["id", "product_id", "vendor_id"],
    filters: {
      id: productId,
      vendor_id: vendorId,
    },
  })

  if (!vendorProducts.length) {
    return res.status(404).json({ message: "Product not found" })
  }

  const vp = vendorProducts[0]

  try {
    // Update product details
    if (title || description || variants || images) {
      await productModule.updateProducts(vp.product_id, {
        ...(title && { title }),
        ...(description && { description }),
        ...(images && { images }),
      })
    }

    // Update vendor product details
    const updates: any = {}
    if (vendor_sku !== undefined) updates.vendor_sku = vendor_sku
    if (vendor_cost !== undefined) updates.vendor_cost = vendor_cost
    if (inventory_quantity !== undefined) updates.inventory_quantity = inventory_quantity

    if (Object.keys(updates).length > 0) {
      await vendorModule.updateVendorProducts(productId, updates)
    }

    const eventBus = req.scope.resolve("event_bus")
    await eventBus.emit("vendor_product.updated", {
      vendor_product_id: productId,
      vendor_id: vendorId,
      product_id: vp.product_id,
      tenant_id: vp.tenant_id || "01KGZ2JRYX607FWMMYQNQRKVWS",
    })

    res.json({ success: true })
  } catch (error: any) {
    return handleApiError(res, error, "VENDOR-PRODUCTS-PRODUCTID")}
}

// DELETE /vendor/products/:productId - Delete/deactivate vendor product
export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  const vendorId = (req as any).vendor_id
  if (!vendorId) {
    return res.status(401).json({ message: "Vendor authentication required" })
  }

  const { productId } = req.params
  const vendorModule = req.scope.resolve("vendor")
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  // Verify ownership
  const { data: vendorProducts } = await query.graph({
    entity: "vendor_product",
    fields: ["id", "vendor_id"],
    filters: {
      id: productId,
      vendor_id: vendorId,
    },
  })

  if (!vendorProducts.length) {
    return res.status(404).json({ message: "Product not found" })
  }

  await vendorModule.updateVendorProducts(productId, {
    status: "inactive",
  })

  const eventBus = req.scope.resolve("event_bus")
  await eventBus.emit("vendor_product.deactivated", {
    vendor_product_id: productId,
    vendor_id: vendorId,
    tenant_id: "01KGZ2JRYX607FWMMYQNQRKVWS",
  })

  res.json({ success: true })
}

