import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "zod"
import { handleApiError } from "../../../lib/api-error-handler"

export const AUTHENTICATE = false

const SEED_NEWSLETTERS = [
  { id: "nl-1", title: "Weekly Tech Digest", description: "Stay ahead with the latest gadgets, software releases, and tech industry insights delivered every Monday.", frequency: "weekly", subscriber_count: 12500, category: "technology", thumbnail: "/seed-images/content%2F1573164713988-8665fc963095.jpg", created_at: "2025-01-01T00:00:00Z" },
  { id: "nl-2", title: "Style & Fashion Update", description: "Curated fashion trends, seasonal collections, and exclusive deals from top designers and brands.", frequency: "weekly", subscriber_count: 8900, category: "fashion", thumbnail: "/seed-images/content%2F1548013146-72479768bada.jpg", created_at: "2025-01-15T00:00:00Z" },
  { id: "nl-3", title: "Foodie Finds", description: "Discover new restaurants, recipes, and food trends in your city every Wednesday.", frequency: "weekly", subscriber_count: 6200, category: "food", thumbnail: "/seed-images/grocery%2F1542838132-92c53300491e.jpg", created_at: "2025-02-01T00:00:00Z" },
  { id: "nl-4", title: "Wellness & Health Brief", description: "Expert health tips, workout routines, and wellness research to keep you at your best.", frequency: "biweekly", subscriber_count: 15300, category: "health", thumbnail: "/seed-images/healthcare%2F1551836022-d5d88e9218df.jpg", created_at: "2025-02-15T00:00:00Z" },
  { id: "nl-5", title: "Market Watch", description: "Daily financial market analysis, investment tips, and economic updates from industry experts.", frequency: "daily", subscriber_count: 22100, category: "finance", thumbnail: "/seed-images/financial%2F1554224155-6726a7aed583.jpg", created_at: "2025-03-01T00:00:00Z" },
]

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const notifService = req.scope.resolve("notificationPreferences") as any
    if (notifService?.listPreferences) {
      const items = await notifService.listPreferences({ channel: "email", eventType: "newsletter" })
      if (items?.length) {
        return res.json({ newsletters: items })
      }
    }
  } catch (_e) {}
  return res.json({ newsletters: SEED_NEWSLETTERS })
}

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
