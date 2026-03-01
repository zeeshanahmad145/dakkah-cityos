import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { handleApiError } from "../../../../../lib/api-error-handler";

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const query = req.scope.resolve("query") as unknown as any;
  const payoutService = req.scope.resolve("payoutModuleService") as unknown as any;
  const { id } = req.params;

  // Get current payout
  const {
    data: [payout],
  } = await query.graph({
    entity: "payout",
    fields: ["*"],
    filters: { id },
  });

  if (!payout) {
    return res.status(404).json({ message: "Payout not found" });
  }

  if (payout.status !== "failed") {
    return res.status(400).json({ message: "Can only retry failed payouts" });
  }

  // Reset status to pending for retry
  const updated = await payoutService.updatePayouts({
    id,
    status: "pending",
    notes: `Retry initiated at ${new Date().toISOString()}. Previous failure: ${payout.notes || "Unknown"}`,
  });

  res.json({
    payout: updated,
    message: "Payout queued for retry",
  });
}
