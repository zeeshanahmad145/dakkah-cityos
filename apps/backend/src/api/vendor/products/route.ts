// @ts-nocheck
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { z } from "zod";
import { handleApiError } from "../../../lib/api-error-handler";

const createVendorProductSchema = z
  .object({
    title: z.string().min(1),
    description: z.string().optional(),
    handle: z.string().optional(),
    vendor_sku: z.string().optional(),
    vendor_cost: z.number().optional(),
    variants: z.array(z.record(z.string(), z.unknown())).optional(),
    images: z.array(z.record(z.string(), z.unknown())).optional(),
    options: z.array(z.record(z.string(), z.unknown())).optional(),
    status: z.string().optional(),
  })
  .passthrough();

// GET /vendor/products - List vendor's products
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY) as unknown as any;

  // Get vendor from authenticated user
  const vendorId = req.vendor_id;
  if (!vendorId) {
    return res.status(401).json({ message: "Vendor authentication required" });
  }

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
      "product.images.*",
    ],
    filters: {
      vendor_id: vendorId,
    },
  });

  const products = vendorProducts.map((vp: any) => ({
    id: vp.id,
    product_id: vp.product_id,
    vendor_sku: vp.vendor_sku,
    vendor_cost: vp.vendor_cost,
    commission_override: vp.commission_override,
    status: vp.status,
    inventory_quantity: vp.inventory_quantity,
    is_primary_vendor: vp.is_primary_vendor,
    title: vp.product?.title,
    handle: vp.product?.handle,
    thumbnail: vp.product?.thumbnail,
    variants: vp.product?.variants || [],
    images: vp.product?.images || [],
    created_at: vp.created_at,
  }));

  res.json({ products });
}

// POST /vendor/products - Create a new product for vendor
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const vendorId = req.vendor_id;
  if (!vendorId) {
    return res.status(401).json({ message: "Vendor authentication required" });
  }

  const parsed = createVendorProductSchema.safeParse(req.body);
  if (!parsed.success) {
    return res
      .status(400)
      .json({ message: "Validation failed", errors: parsed.error.issues });
  }

  const {
    title,
    description,
    handle,
    vendor_sku,
    vendor_cost,
    variants,
    images,
    options,
    status = "draft",
  } = parsed.data;

  const vendorModule = req.scope.resolve("vendor") as unknown as any;
  const productModule = req.scope.resolve("product") as unknown as any;

  try {
    // Create the product first
    const [product] = await productModule.createProducts([
      {
        title,
        description,
        handle,
        status: "draft", // Products start as draft, need admin approval
        options: options || [],
        variants: variants || [],
        images: images || [],
      },
    ]);

    // Link product to vendor
    const vendorProduct = await vendorModule.createVendorProducts({
      vendor_id: vendorId,
      product_id: product.id,
      vendor_sku,
      vendor_cost,
      status: "pending_approval",
      is_primary_vendor: true,
    });

    const eventBus = req.scope.resolve("event_bus") as unknown as any;
    await eventBus.emit("vendor_product.created", {
      vendor_product_id: vendorProduct.id,
      vendor_id: vendorId,
      product_id: product.id,
      tenant_id: vendorProduct.tenant_id || "01KGZ2JRYX607FWMMYQNQRKVWS",
    });

    res.status(201).json({
      product: {
        ...vendorProduct,
        title: product.title,
        handle: product.handle,
      },
    });
  } catch (error: unknown) {
    return handleApiError(res, error, "VENDOR-PRODUCTS");
  }
}
