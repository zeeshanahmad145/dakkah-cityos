import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { z } from "zod";
import { handleApiError } from "../../../../lib/api-error-handler";

const updateDisputeSchema = z
  .object({
    reason: z.string().optional(),
    description: z.string().optional(),
    status: z.string().optional(),
    resolution: z.string().optional(),
    metadata: z.record(z.string(), z.unknown()).optional(),
  })
  .passthrough();

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const service = req.scope.resolve("dispute") as unknown as any;
    const dispute = await service.retrieveDispute(req.params.id);
    res.json({ dispute });
  } catch (error: unknown) {
    return handleApiError(res, error, "ADMIN-DISPUTES-ID");
  }
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const service = req.scope.resolve("dispute") as unknown as any;
    const parsed = updateDisputeSchema.safeParse(req.body);
    if (!parsed.success)
      return res
        .status(400)
        .json({ message: "Validation failed", errors: parsed.error.issues });
    const dispute = await service.updateDisputes(req.params.id, parsed.data);
    res.json({ dispute });
  } catch (error: unknown) {
    return handleApiError(res, error, "ADMIN-DISPUTES-ID");
  }
}

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  try {
    const service = req.scope.resolve("dispute") as unknown as any;
    await service.deleteDisputes(req.params.id);
    res.status(200).json({ id: req.params.id, deleted: true });
  } catch (error: unknown) {
    return handleApiError(res, error, "ADMIN-DISPUTES-ID");
  }
}
