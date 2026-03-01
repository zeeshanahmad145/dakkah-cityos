import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { z } from "zod";
import { handleApiError } from "../../../../../lib/api-error-handler";

const declineQuoteSchema = z.object({
  reason: z.string().optional(),
});

/**
 * POST /store/quotes/:id/decline
 * Decline an approved quote
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const quoteModuleService = req.scope.resolve("quote") as unknown as any;
    const { id } = req.params;

    const parsed = declineQuoteSchema.safeParse(req.body);
    if (!parsed.success) {
      return res
        .status(400)
        .json({ message: "Validation failed", errors: parsed.error.issues });
    }

    const { reason } = parsed.data;

    if (!req.auth_context?.actor_id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const quote = await quoteModuleService.retrieveQuote(id);

    // Verify ownership
    if (quote.customer_id !== req.auth_context.actor_id) {
      return res.status(403).json({ message: "Forbidden" });
    }

    // Update status to declined
    const updatedQuote = await quoteModuleService.updateQuotes({
      id,
      status: "declined",
      declined_at: new Date(),
      declined_reason: reason,
    });

    res.json({ quote: updatedQuote });
  } catch (error: unknown) {
    handleApiError(res, error, "POST store quotes id decline");
  }
}
