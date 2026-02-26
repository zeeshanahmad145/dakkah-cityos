import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { handleApiError } from "../../../../lib/api-error-handler";

const SEED_DATA = [
  { id: "nl-1", name: "Tech Trends Weekly", topic: "technology", thumbnail: "/seed-images/newsletters%2F1518770660439-4636190af475.jpg", edition_date: "2026-02-10", topics_covered: ["AI & Machine Learning", "Web3 Updates", "Cloud Computing"], description: "Stay ahead with the latest technology trends, product launches, and industry insights.", topics: ["Artificial Intelligence", "Cloud Computing", "Cybersecurity", "Software Development"], testimonials: [{ name: "Ahmed K.", quote: "The best tech newsletter I've subscribed to. Always relevant and insightful.", role: "CTO" }, { name: "Sara M.", quote: "Keeps me updated on industry trends without overwhelming my inbox.", role: "Software Engineer" }, { name: "Omar R.", quote: "A must-read for anyone in tech. Concise and actionable.", role: "Product Manager" }] },
  { id: "nl-2", name: "Style & Living", topic: "lifestyle", thumbnail: "/seed-images/newsletters%2F1489987707025-afc232f7ea0f.jpg", edition_date: "2026-02-08", topics_covered: ["Fashion Tips", "Interior Design", "Wellness"], description: "Your weekly guide to fashion, home design, and modern living.", topics: ["Fashion Trends", "Home Decor", "Wellness Tips", "Travel Inspiration"], testimonials: [{ name: "Layla H.", quote: "Love the curated style picks every week. My go-to for inspiration!", role: "Fashion Blogger" }, { name: "Fatima A.", quote: "Beautiful layouts and genuinely useful lifestyle advice.", role: "Interior Designer" }, { name: "Nadia S.", quote: "The wellness section alone is worth subscribing for.", role: "Reader" }] },
  { id: "nl-3", name: "Business Insider Report", topic: "business", thumbnail: "/seed-images/content%2F1460925895917-afdab827c52f.jpg", edition_date: "2026-02-12", topics_covered: ["Market Analysis", "Startup News", "Investment Tips"], description: "Comprehensive business intelligence and market analysis for professionals.", topics: ["Market Analysis", "Startup Ecosystem", "Investment Strategies", "Leadership Insights"], testimonials: [{ name: "Khalid W.", quote: "Essential reading for business leaders. The market analysis is top-notch.", role: "CEO" }, { name: "Badr T.", quote: "Helped me make better investment decisions consistently.", role: "Investor" }, { name: "Reem D.", quote: "The startup coverage is unmatched. Great for founders.", role: "Entrepreneur" }] },
  { id: "nl-4", name: "Green Planet Digest", topic: "sustainability", thumbnail: "/seed-images/newsletters%2F1441974231531-c6227db76b6e.jpg", edition_date: "2026-02-05", topics_covered: ["Climate Action", "Sustainable Products", "Eco-Innovations"], description: "Environmental news, sustainable living tips, and eco-friendly product reviews.", topics: ["Climate Change", "Renewable Energy", "Sustainable Living", "Eco-Friendly Products"], testimonials: [{ name: "Huda J.", quote: "Changed my perspective on sustainable living. Highly recommend!", role: "Environmental Activist" }, { name: "Faisal B.", quote: "Great product reviews that help me make eco-conscious choices.", role: "Reader" }, { name: "Mona K.", quote: "The climate action updates keep me informed and motivated.", role: "Researcher" }] },
  { id: "nl-5", name: "Health & Wellness Focus", topic: "health", thumbnail: "/seed-images/bundles%2F1571019613454-1cb2f99b2d8b.jpg", edition_date: "2026-02-11", topics_covered: ["Nutrition Guide", "Fitness Plans", "Mental Health"], description: "Expert-backed health advice, workout routines, and nutrition guides.", topics: ["Nutrition Science", "Fitness Training", "Mental Health", "Preventive Care"], testimonials: [{ name: "Youssef N.", quote: "The nutrition guides are science-backed and easy to follow.", role: "Nutritionist" }, { name: "Amira L.", quote: "Helped me build a sustainable fitness routine. Love it!", role: "Fitness Enthusiast" }, { name: "Tariq F.", quote: "The mental health section is thoughtful and much needed.", role: "Psychologist" }] },
];

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const notifService = req.scope.resolve("notificationPreferences") as any;
    const { id } = req.params;
    const item = await notifService.retrieveNotificationPreference(id);
    if (!item) {
      const seedItem = SEED_DATA.find(i => i.id === id) || SEED_DATA[0];
      return res.json({ item: seedItem });
    }
    return res.json({ item });
  } catch (error: any) {
    const { id } = req.params;
    const seedItem = SEED_DATA.find(i => i.id === id) || SEED_DATA[0];
    return res.json({ item: seedItem });
  }
}

// DELETE /store/newsletters/:id — unsubscribe
export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  try {
    const notifService = req.scope.resolve("notificationPreferences") as any;
    const { id } = req.params;
    await notifService.updatePreference({
      id,
      enabled: false,
    });
    return res.json({ success: true, message: "Unsubscribed successfully" });
  } catch (error: any) {
    handleApiError(res, error, "DELETE store newsletters id");
  }
}
