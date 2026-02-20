import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { z } from "zod"
import { handleApiError } from "../../../../lib/api-error-handler"

// POST handler does not extract or use any fields from the request body
// Action triggered by URL path parameter [id] - status updated to "submitted"
const submitQuoteSchema = z.object({
}).strict()

/**
 * GET /store/quotes/:id
 * Get single quote details
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const quoteModuleService = req.scope.resolve("quoteModuleService") as any;
    const { id } = req.params;

    if (!req.auth_context?.actor_id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const quote = await quoteModuleService.retrieveQuote(id);

    // Verify ownership
    if (quote.customer_id !== req.auth_context.actor_id) {
      return res.status(403).json({ message: "Forbidden" });
    }

    res.json({ quote });

  } catch (error: any) {
    handleApiError(res, error, "GET store quotes id")}
}

/**
 * POST /store/quotes/:id/submit
 * Submit quote for review
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const quoteModuleService = req.scope.resolve("quoteModuleService") as any;
    const { id } = req.params;

    if (!req.auth_context?.actor_id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const parsed = submitQuoteSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: "Validation failed", errors: parsed.error.issues });
    }

    const quote = await quoteModuleService.retrieveQuote(id);

    // Verify ownership
    if (quote.customer_id !== req.auth_context.actor_id) {
      return res.status(403).json({ message: "Forbidden" });
    }

    // Update status to submitted
    const updatedQuote = await quoteModuleService.updateQuotes({
      id,
      status: "submitted",
    });

    res.json({ quote: updatedQuote });

  } catch (error: any) {
    handleApiError(res, error, "POST store quotes id")}
}

