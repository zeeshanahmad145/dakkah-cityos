import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "zod"
import { handleApiError } from "../../../lib/api-error-handler"

const newsletterSubscribeSchema = z.object({
  email: z.string().min(1),
  tenant_id: z.string().min(1),
})

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const parsed = newsletterSubscribeSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ message: "Validation failed", errors: parsed.error.issues })
  }

  const { email, tenant_id } = parsed.data

  try {
    const notifService = req.scope.resolve("notificationPreferences") as any
    const customerId = req.auth_context?.actor_id

    const subscriberId = customerId || `anon_${email}`

    const result = await notifService.updatePreference({
      customerId: subscriberId,
      tenantId: tenant_id,
      channel: "email",
      eventType: "newsletter",
      enabled: true,
      frequency: "weekly_digest",
    })

    res.status(201).json({
      success: true,
      subscription: {
        id: result.id,
        email,
        channel: "email",
        event_type: "newsletter",
        subscribed: true,
      },
    })
  } catch (error: any) {
    handleApiError(res, error, "STORE-NEWSLETTER")}
}
