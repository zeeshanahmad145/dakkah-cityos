import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

const SEED_SERVICES = [
  { id: "sp_01", service_name: "Deep Tissue Massage", description: "Professional deep tissue massage therapy to relieve chronic muscle tension and improve circulation.", provider: "Wellness Spa & Therapy Center", category: "wellness", duration: 60, price: 25000, currency: "SAR", rating: 4.9, review_count: 124, thumbnail: "/seed-images/bookings%2F1544161515-4ab6ce6db874.jpg", location: "Riyadh", availability: "Daily 9AM-9PM" },
  { id: "sp_02", service_name: "Hair Styling & Color", description: "Expert hair styling, coloring, and treatment services for all hair types.", provider: "Glamour Hair Studio", category: "beauty", duration: 90, price: 35000, currency: "SAR", rating: 4.7, review_count: 89, thumbnail: "/seed-images/bookings%2F1560066984-138dadb4c035.jpg", location: "Jeddah", availability: "Mon-Sat 10AM-8PM" },
  { id: "sp_03", service_name: "Personal Training Session", description: "One-on-one personal training session with certified fitness coach.", provider: "FitLife Performance Center", category: "fitness", duration: 60, price: 20000, currency: "SAR", rating: 4.8, review_count: 156, thumbnail: "/seed-images/bookings%2F1534438327276-14e5300c3a48.jpg", location: "Riyadh", availability: "Daily 6AM-10PM" },
  { id: "sp_04", service_name: "Home Cleaning Service", description: "Professional deep cleaning service for apartments and villas.", provider: "CleanPro Services", category: "home", duration: 180, price: 45000, currency: "SAR", rating: 4.6, review_count: 210, thumbnail: "/seed-images/bookings%2F1581578731548-c64695cc6952.jpg", location: "Multiple Cities", availability: "Daily 8AM-6PM" },
  { id: "sp_05", service_name: "Car Detailing Premium", description: "Full interior and exterior car detailing with ceramic coating option.", provider: "AutoShine Detailing", category: "automotive", duration: 240, price: 55000, currency: "SAR", rating: 4.9, review_count: 78, thumbnail: "/seed-images/bookings%2F1520340356584-f9917d1eea6f.jpg", location: "Riyadh", availability: "Daily 7AM-7PM" },
  { id: "sp_06", service_name: "Photography Session", description: "Professional portrait, family, or event photography session.", provider: "Capture Moments Studio", category: "creative", duration: 120, price: 80000, currency: "SAR", rating: 4.8, review_count: 45, thumbnail: "/seed-images/bookings%2F1554048612-b6a482bc67e5.jpg", location: "Jeddah", availability: "By Appointment" },
]

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const { id } = req.params
    const mod = req.scope.resolve("booking") as any
    const item = await mod.retrieveServiceProvider(id)
    if (item) return res.json({ item })
    const seed = SEED_SERVICES.find((s) => s.id === id) || SEED_SERVICES[0]
    return res.json({ item: { ...seed, id } })
  } catch {
    const { id } = req.params
    const seed = SEED_SERVICES.find((s) => s.id === id) || SEED_SERVICES[0]
    return res.json({ item: { ...seed, id } })
  }
}
