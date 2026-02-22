import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { handleApiError } from "../../../../../lib/api-error-handler";
import ReviewModuleService from "../../../../../modules/review/service";

// GET /store/reviews/products/:id - Get reviews for a product
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const reviewService = req.scope.resolve("review") as any;

  console.log("Reviews Route Hit:");
  console.log("req.params:", req.params);
  console.log("req.url:", req.url);

  // Safely extract ID, handling potential undefined params
  const id = req.params?.id;

  if (!id) {
    console.log("ID missing in req.params");
    // If route param failed, try context or throw validation error
    return res.status(400).json({
      message: "Product ID is missing or invalid URL parameters",
      code: "INVALID_REQUEST_PARAMS",
    });
  }

  const { limit = "10", offset = "0" } = req.query as {
    limit?: string;
    offset?: string;
  };

  try {
    const reviews = await reviewService.listProductReviews(id, {
      limit: parseInt(limit),
      offset: parseInt(offset),
      approved_only: true,
    });

    const summary = await reviewService.getProductRatingSummary(id);

    res.json({
      reviews,
      summary,
      count: reviews.length,
      limit: parseInt(limit),
      offset: parseInt(offset),
    });
  } catch (error: any) {
    // Detailed error for debugging
    console.error("Failed to fetch reviews:", error);
    return res.status(400).json({
      message: error.message,
      code: "REVIEW_FETCH_ERROR",
      details: error.stack,
    });
    // handleApiError(res, error, "STORE-REVIEWS-PRODUCTS-ID");
  }
}
