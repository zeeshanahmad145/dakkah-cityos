import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { z } from "zod";
import { handleApiError } from "../../../../lib/api-error-handler";

const updatePurchaseOrderSchema = z
  .object({
    status: z.string().optional(),
    notes: z.string().optional(),
    metadata: z.record(z.string(), z.unknown()).optional(),
  })
  .passthrough();

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const query = req.scope.resolve("query") as unknown as any;
    const { id } = req.params;

    const {
      data: [purchase_order],
    } = await query.graph({
      entity: "purchase_order",
      fields: [
        "id",
        "company_id",
        "customer_id",
        "po_number",
        "status",
        "submitted_at",
        "approved_at",
        "approved_by",
        "rejected_at",
        "rejected_by",
        "rejection_reason",
        "notes",
        "subtotal",
        "tax_total",
        "shipping_total",
        "discount_total",
        "total",
        "currency_code",
        "created_at",
        "updated_at",
        "items.*",
        "company.*",
      ],
      filters: { id },
    });

    if (!purchase_order) {
      return res.status(404).json({ message: "Purchase order not found" });
    }

    res.json({ purchase_order });
  } catch (error: unknown) {
    handleApiError(res, error, "GET admin purchase-orders id");
  }
}

export async function PUT(req: MedusaRequest, res: MedusaResponse) {
  try {
    const companyModuleService = req.scope.resolve("company") as unknown as any;
    const { id } = req.params;
    const parsed = updatePurchaseOrderSchema.safeParse(req.body);
    if (!parsed.success) {
      return res
        .status(400)
        .json({ message: "Validation failed", errors: parsed.error.issues });
    }

    const purchase_order = await companyModuleService.updatePurchaseOrders({
      id,
      ...parsed.data,
    });

    res.json({ purchase_order });
  } catch (error: unknown) {
    handleApiError(res, error, "PUT admin purchase-orders id");
  }
}
