import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "zod"
import { handleApiError } from "../../../../lib/api-error-handler"
import { enrichDetailItem } from "../../../../lib/detail-enricher"

const updateNotificationPreferenceSchema = z.object({
  channel: z.string().min(1).optional(),
  event_type: z.string().min(1).optional(),
  enabled: z.boolean().optional(),
  frequency: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
})

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const service = req.scope.resolve("notificationPreferencesModuleService") as any
    const item = await service.retrieveNotificationPreference(req.params.id)
    res.json({ item: enrichDetailItem(item, "utilities") })
  } catch (error: any) {
    return handleApiError(res, error, "STORE-NOTIFICATION-PREFERENCES-ID")}
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const customerId = (req as any).auth_context?.actor_id
    if (!customerId) {
      return res.status(401).json({ message: "Authentication required" })
    }

    const parsed = updateNotificationPreferenceSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ message: "Validation failed", errors: parsed.error.issues })
    }

    const service = req.scope.resolve("notificationPreferencesModuleService") as any
    const item = await service.updateNotificationPreferences(req.params.id, parsed.data)
    res.json({ item: enrichDetailItem(item, "utilities") })
  } catch (error: any) {
    return handleApiError(res, error, "STORE-NOTIFICATION-PREFERENCES-ID")}
}

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  try {
    const customerId = (req as any).auth_context?.actor_id
    if (!customerId) {
      return res.status(401).json({ message: "Authentication required" })
    }
    const service = req.scope.resolve("notificationPreferencesModuleService") as any
    await service.deleteNotificationPreferences(req.params.id)
    res.status(200).json({ id: req.params.id, deleted: true })
  } catch (error: any) {
    return handleApiError(res, error, "STORE-NOTIFICATION-PREFERENCES-ID")}
}
