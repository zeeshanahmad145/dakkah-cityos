import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { z } from "zod";
import { handleApiError } from "../../../lib/api-error-handler";

const createNotificationPreferenceSchema = z.object({
  tenant_id: z.string().min(1).optional(),
  channel: z.string().min(1).optional(),
  event_type: z.string().min(1).optional(),
  enabled: z.boolean().optional(),
  frequency: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const service = req.scope.resolve("notificationPreferencesModuleService") as unknown as any;
    const customerId =
      req.auth_context?.actor_id || (req.query.customer_id as string);
    if (!customerId) {
      return res.status(401).json({ message: "Authentication required" });
    }
    const filters: Record<string, any> = { customer_id: customerId };
    if (req.query.tenant_id) filters.tenant_id = req.query.tenant_id;
    const items = await service.listNotificationPreferences(filters);
    res.json({ items, count: Array.isArray(items) ? items.length : 0 });
  } catch (error: unknown) {
    return handleApiError(res, error, "STORE-NOTIFICATION-PREFERENCES");
  }
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const service = req.scope.resolve("notificationPreferencesModuleService") as unknown as any;
    const customerId = req.auth_context?.actor_id;
    if (!customerId) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const parsed = createNotificationPreferenceSchema.safeParse(req.body);
    if (!parsed.success) {
      return res
        .status(400)
        .json({ message: "Validation failed", errors: parsed.error.issues });
    }

    const item = await service.createNotificationPreferences({
      ...parsed.data,
      customer_id: customerId,
    });
    res.status(201).json({ item });
  } catch (error: unknown) {
    return handleApiError(res, error, "STORE-NOTIFICATION-PREFERENCES");
  }
}
