import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { handleApiError } from "../../../lib/api-error-handler";

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const items = [
      { id: "nl-1", name: "Tech Trends Weekly", topic: "technology", thumbnail: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&h=600&fit=crop", edition_date: "2026-02-10", topics_covered: ["AI & Machine Learning", "Web3 Updates", "Cloud Computing"], description: "Stay ahead with the latest technology trends, product launches, and industry insights." },
      { id: "nl-2", name: "Style & Living", topic: "lifestyle", thumbnail: "https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=800&h=600&fit=crop", edition_date: "2026-02-08", topics_covered: ["Fashion Tips", "Interior Design", "Wellness"], description: "Your weekly guide to fashion, home design, and modern living." },
      { id: "nl-3", name: "Business Insider Report", topic: "business", thumbnail: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=600&fit=crop", edition_date: "2026-02-12", topics_covered: ["Market Analysis", "Startup News", "Investment Tips"], description: "Comprehensive business intelligence and market analysis for professionals." },
      { id: "nl-4", name: "Green Planet Digest", topic: "sustainability", thumbnail: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&h=600&fit=crop", edition_date: "2026-02-05", topics_covered: ["Climate Action", "Sustainable Products", "Eco-Innovations"], description: "Environmental news, sustainable living tips, and eco-friendly product reviews." },
      { id: "nl-5", name: "Health & Wellness Focus", topic: "health", thumbnail: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=600&fit=crop", edition_date: "2026-02-11", topics_covered: ["Nutrition Guide", "Fitness Plans", "Mental Health"], description: "Expert-backed health advice, workout routines, and nutrition guides." },
    ]
    return res.json({
      items,
      newsletters: items,
      count: items.length,
    });
  } catch (error: any) {
    handleApiError(res, error, "GET store newsletters");
  }
}

// POST /store/newsletters — subscribe to a newsletter (migrated from /store/newsletter)
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const { email, tenant_id } = req.body as { email: string; tenant_id: string };

  if (!email || !tenant_id) {
    return res
      .status(400)
      .json({ message: "email and tenant_id are required" });
  }

  try {
    const notifService = req.scope.resolve("notificationPreferences") as any;
    const customerId = req.auth_context?.actor_id;
    const subscriberId = customerId || `anon_${email}`;

    const result = await notifService.updatePreference({
      customerId: subscriberId,
      tenantId: tenant_id,
      channel: "email",
      eventType: "newsletter",
      enabled: true,
      frequency: "weekly_digest",
    });

    res.status(201).json({
      success: true,
      subscription: {
        id: result.id,
        email,
        channel: "email",
        event_type: "newsletter",
        subscribed: true,
      },
    });
  } catch (error: any) {
    handleApiError(res, error, "POST store newsletters");
  }
}
