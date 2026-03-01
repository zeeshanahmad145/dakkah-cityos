import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { z } from "zod";
import { handleApiError } from "../../../../lib/api-error-handler";

const updatePreferenceSchema = z
  .object({
    channel: z.string().optional(),
    enabled: z.boolean().optional(),
    frequency: z.string().optional(),
    metadata: z.record(z.string(), z.unknown()).optional(),
  })
  .passthrough();

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const service = req.scope.resolve("notificationPreferencesModuleService") as unknown as any;
    const item = await service.retrieveNotificationPreference(req.params.id);
    res.json({ item });
  } catch (error: unknown) {
    return handleApiError(res, error, "ADMIN-NOTIFICATION-PREFERENCES-ID");
  }
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const service = req.scope.resolve("notificationPreferencesModuleService") as unknown as any;
    const parsed = updatePreferenceSchema.safeParse(req.body);
    if (!parsed.success) {
      return res
        .status(400)
        .json({ message: "Validation failed", errors: parsed.error.issues });
    }
    const item = await service.updateNotificationPreferences(
      req.params.id,
      parsed.data,
    );
    res.json({ item });
  } catch (error: unknown) {
    return handleApiError(res, error, "ADMIN-NOTIFICATION-PREFERENCES-ID");
  }
}

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  try {
    const service = req.scope.resolve("notificationPreferencesModuleService") as unknown as any;
    await service.deleteNotificationPreferences(req.params.id);
    res.status(200).json({ id: req.params.id, deleted: true });
  } catch (error: unknown) {
    return handleApiError(res, error, "ADMIN-NOTIFICATION-PREFERENCES-ID");
  }
}
