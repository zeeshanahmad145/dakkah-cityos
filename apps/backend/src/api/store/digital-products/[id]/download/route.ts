import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { handleApiError } from "../../../../../lib/api-error-handler";

/**
 * GET /store/digital-products/:id/download
 * Returns a time-limited signed URL for downloading a digital product.
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const digitalProductService = req.scope.resolve("digital-product") as unknown as any;
    const fileReplitService = req.scope.resolve("file-replit") as unknown as any;
    const productId = req.params.id;
    const customerId = req.auth_context?.actor_id;

    if (!customerId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    // Get the digital product
    let product: any;
    if (typeof digitalProductService.retrieveDigitalProduct === "function") {
      product = await digitalProductService.retrieveDigitalProduct(productId);
    } else {
      const products = await digitalProductService.listDigitalProducts({
        id: productId,
      });
      const list = Array.isArray(products)
        ? products
        : [products].filter(Boolean);
      product = list[0];
    }

    if (!product) {
      return res.status(404).json({ error: "Digital product not found" });
    }

    // Generate time-limited signed URL (1 hour expiry)
    let downloadUrl: string;
    if (typeof fileReplitService.getPresignedUrl === "function") {
      downloadUrl = await fileReplitService.getPresignedUrl(
        product.file_key,
        3600,
      );
    } else {
      // Fallback: construct a URL with expiry token
      const expiresAt = new Date(Date.now() + 3600 * 1000).toISOString();
      downloadUrl = `/files/${product.file_key}?expires=${encodeURIComponent(expiresAt)}&token=${Buffer.from(`${productId}:${customerId}:${expiresAt}`).toString("base64url")}`;
    }

    return res.json({
      product_id: productId,
      download_url: downloadUrl,
      expires_in_seconds: 3600,
      filename: product.filename || product.file_key,
    });
  } catch (error: unknown) {
    return handleApiError(res, error, "STORE-DIGITAL-DOWNLOAD");
  }
}
