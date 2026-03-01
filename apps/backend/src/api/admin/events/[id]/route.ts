import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { z } from "zod";
import { handleApiError } from "../../../../lib/api-error-handler";

const eventActionSchema = z
  .object({
    action: z.enum(["publish", "retry"]),
  })
  .passthrough();

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const service = req.scope.resolve("eventModuleService") as unknown as any;
    const item = await service.retrieveEventOutbox(req.params.id);
    res.json({ item });
  } catch (error: unknown) {
    return handleApiError(res, error, "ADMIN-EVENTS-ID");
  }
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const service = req.scope.resolve("eventModuleService") as unknown as any;
    const parsed = eventActionSchema.safeParse(req.body);
    if (!parsed.success)
      return res
        .status(400)
        .json({ message: "Validation failed", errors: parsed.error.issues });
    const { action } = parsed.data;
    const item = await service.updateEventOutboxes(req.params.id, {
      status: action === "publish" ? "published" : "pending",
    });
    res.json({ item });
  } catch (error: unknown) {
    return handleApiError(res, error, "ADMIN-EVENTS-ID");
  }
}

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  try {
    const service = req.scope.resolve("eventModuleService") as unknown as any;
    await service.deleteEventOutboxes(req.params.id);
    res.status(200).json({ id: req.params.id, deleted: true });
  } catch (error: unknown) {
    return handleApiError(res, error, "ADMIN-EVENTS-ID");
  }
}
