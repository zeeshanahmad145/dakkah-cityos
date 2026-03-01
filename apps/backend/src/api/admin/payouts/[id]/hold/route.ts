import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { z } from "zod";
import { handleApiError } from "../../../../../lib/api-error-handler";

const holdPayoutSchema = z
  .object({
    reason: z.string().optional(),
  })
  .passthrough();

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const parsed = holdPayoutSchema.safeParse(req.body);
    if (!parsed.success) {
      return res
        .status(400)
        .json({ message: "Validation failed", errors: parsed.error.issues });
    }

    const query = req.scope.resolve("query") as unknown as any;
    const payoutService = req.scope.resolve("payout") as unknown as any;
    const { id } = req.params;
    const { reason } = parsed.data;

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

    if (payout.status !== "pending") {
      return res.status(400).json({ message: "Can only hold pending payouts" });
    }

    const updated = await payoutService.updatePayouts({
      id,
      status: "on_hold",
      notes: reason || "Put on hold by admin",
    });

    res.json({
      payout: updated,
      message: "Payout placed on hold",
    });
  } catch (error: unknown) {
    handleApiError(res, error, "POST admin payouts id hold");
  }
}
