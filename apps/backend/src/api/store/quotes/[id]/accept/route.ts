import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { z } from "zod"
import { handleApiError } from "../../../../../lib/api-error-handler"

// Accept may include optional notes/metadata
const acceptQuoteSchema = z.object({
  notes: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
}).passthrough()

/**
 * POST /store/quotes/:id/accept
 * Accept an approved quote
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const quoteModuleService = req.scope.resolve("quoteModuleService") as any;
    const { id } = req.params;

    if (!req.auth_context?.actor_id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const parsed = acceptQuoteSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: "Validation failed", errors: parsed.error.issues });
    }

    const quote = await quoteModuleService.retrieveQuote(id);

    // Verify ownership
    if (quote.customer_id !== req.auth_context.actor_id) {
      return res.status(403).json({ message: "Forbidden" });
    }

    // Verify quote is approved
    if (quote.status !== "approved") {
      return res.status(400).json({ 
        message: "Quote must be approved before acceptance" 
      });
    }

    // Check if quote is still valid
    const isValid = await quoteModuleService.isQuoteValid(id);
    if (!isValid) {
      return res.status(400).json({ 
        message: "Quote has expired" 
      });
    }

    // Update status to accepted
    const updatedQuote = await quoteModuleService.updateQuotes({
      id,
      status: "accepted",
      accepted_at: new Date(),
    });

    res.json({ quote: updatedQuote });

  } catch (error: any) {
    handleApiError(res, error, "POST store quotes id accept")}
}

