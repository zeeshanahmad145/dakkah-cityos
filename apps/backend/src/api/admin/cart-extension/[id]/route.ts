import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { z } from "zod";
import { handleApiError } from "../../../../lib/api-error-handler";

const updateCartExtensionSchema = z
  .object({
    gift_wrap: z.boolean().optional(),
    gift_message: z.string().nullable().optional(),
    notes: z.string().nullable().optional(),
  })
  .passthrough();

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const service = req.scope.resolve("cartExtension") as unknown as any;
    const item = await service.retrieveCartExtension(req.params.id);
    res.json({ item });
  } catch (error: unknown) {
    return handleApiError(res, error, "ADMIN-CART-EXTENSION-ID");
  }
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const service = req.scope.resolve("cartExtension") as unknown as any;
    const parsed = updateCartExtensionSchema.safeParse(req.body);
    if (!parsed.success)
      return res
        .status(400)
        .json({ message: "Validation failed", errors: parsed.error.issues });
    const item = await service.updateCartExtensions(req.params.id, parsed.data);
    res.json({ item });
  } catch (error: unknown) {
    return handleApiError(res, error, "ADMIN-CART-EXTENSION-ID");
  }
}

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  try {
    const service = req.scope.resolve("cartExtension") as unknown as any;
    await service.deleteCartExtensions(req.params.id);
    res.status(200).json({ id: req.params.id, deleted: true });
  } catch (error: unknown) {
    return handleApiError(res, error, "ADMIN-CART-EXTENSION-ID");
  }
}
