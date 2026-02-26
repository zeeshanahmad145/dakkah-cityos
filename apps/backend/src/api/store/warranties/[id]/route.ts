import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { handleApiError } from "../../../../lib/api-error-handler"

const SEED_DATA = [
  {
    id: "warranty-seed-1",
    name: "Essential Protection Plan",
    description: "Basic warranty coverage for manufacturing defects and hardware failures. Ideal for everyday electronics.",
    plan_type: "basic",
    duration_months: 12,
    currency_code: "USD",
    coverage: ["Manufacturing defects", "Hardware failures", "Battery replacement"],
    exclusions: ["Accidental damage", "Water damage", "Cosmetic wear"],
    covered_items: ["Manufacturing defects", "Hardware failures", "Battery replacement", "Power supply issues", "Internal component malfunctions"],
    excluded_items: ["Accidental damage", "Water damage", "Cosmetic wear"],
    is_active: true,
    price: 2999,
    rating: 4.2,
    thumbnail: "/seed-images/warranties/1589829545856-d10d557cf95f.jpg",
    metadata: { thumbnail: "/seed-images/content/1454165804606-c3d57bc86b40.jpg" },
    highlights: ["12-month coverage", "No deductible", "Free battery replacement", "24/7 support hotline"],
    faq: [
      { question: "What does this warranty cover?", answer: "This plan covers manufacturing defects, hardware failures, and battery replacement for 12 months from the date of purchase." },
      { question: "How do I file a claim?", answer: "You can file a claim online through our portal or call our 24/7 support hotline. Most claims are processed within 3-5 business days." },
      { question: "Is there a deductible?", answer: "No, this plan has zero deductible for all covered repairs." },
    ],
    claims_process: [
      { title: "Report Issue", description: "Contact our support team online or by phone to report the issue" },
      { title: "Diagnostic Review", description: "Our technicians will review your claim and diagnose the problem" },
      { title: "Repair or Replace", description: "We'll repair your device or send a replacement within 5-7 business days" },
    ],
    reviews: [
      { author: "Ahmed B.", rating: 4, comment: "My phone battery was replaced for free. Quick and hassle-free process.", created_at: "2024-11-14T09:00:00Z" },
      { author: "Sara T.", rating: 5, comment: "Filed a claim for a hardware failure and got it fixed in 3 days. Great service!", created_at: "2024-11-01T14:30:00Z" },
      { author: "Khalid M.", rating: 4, comment: "Good basic coverage for the price. The 24/7 hotline is very responsive.", created_at: "2024-10-18T10:00:00Z" },
      { author: "Noura F.", rating: 3, comment: "Decent plan but wish it covered accidental damage too.", created_at: "2024-10-05T16:15:00Z" },
      { author: "Omar H.", rating: 5, comment: "Zero deductible is a huge plus. My laptop was repaired at no extra cost.", created_at: "2024-09-20T11:30:00Z" },
    ],
  },
  {
    id: "warranty-seed-2",
    name: "Standard Care Plan",
    description: "Extended warranty with accidental damage protection. Covers drops, spills, and mechanical failures.",
    plan_type: "standard",
    duration_months: 24,
    currency_code: "USD",
    coverage: ["Manufacturing defects", "Accidental damage", "Power surge protection", "Battery replacement", "Screen repair"],
    exclusions: ["Intentional damage", "Loss or theft", "Cosmetic wear"],
    covered_items: ["Manufacturing defects", "Accidental damage", "Power surge protection", "Battery replacement", "Screen repair"],
    excluded_items: ["Intentional damage", "Loss or theft", "Cosmetic wear"],
    is_active: true,
    price: 5999,
    rating: 4.5,
    thumbnail: "/seed-images/warranties/1506784983877-45594efa4cbe.jpg",
    metadata: { thumbnail: "/seed-images/government/1450101499163-c8848c66ca85.jpg" },
    highlights: ["24-month coverage", "Accidental damage protection", "Screen repair included", "Priority service queue"],
    faq: [
      { question: "Does this cover screen cracks?", answer: "Yes, screen repair is fully covered under this plan with no additional cost." },
      { question: "What happens if my device can't be repaired?", answer: "If repair isn't possible, we'll replace your device with an equivalent model." },
      { question: "Can I transfer the warranty?", answer: "Yes, warranties can be transferred to a new owner with proof of purchase." },
    ],
    claims_process: [
      { title: "Submit Claim", description: "File a claim online with photos of the damage" },
      { title: "Ship Device", description: "Use our prepaid shipping label to send your device for repair" },
      { title: "Repair & Return", description: "Device repaired and shipped back within 7-10 business days" },
    ],
    reviews: [
      { author: "Faisal R.", rating: 5, comment: "Dropped my phone and the screen was fixed completely free. This plan pays for itself.", created_at: "2024-11-12T08:00:00Z" },
      { author: "Huda K.", rating: 5, comment: "Accidental damage coverage saved me. Screen repair was seamless.", created_at: "2024-10-28T13:00:00Z" },
      { author: "Tariq W.", rating: 4, comment: "Prepaid shipping label made the process very convenient.", created_at: "2024-10-15T10:45:00Z" },
      { author: "Lina S.", rating: 5, comment: "Priority queue meant my device was fixed faster than expected.", created_at: "2024-09-30T15:30:00Z" },
      { author: "Bader N.", rating: 4, comment: "Good coverage for 2 years. Worth every penny for peace of mind.", created_at: "2024-09-12T09:15:00Z" },
    ],
  },
  {
    id: "warranty-seed-3",
    name: "Premium Shield Plan",
    description: "Comprehensive coverage including accidental damage, water damage, and theft protection with same-day replacement.",
    plan_type: "premium",
    duration_months: 36,
    currency_code: "USD",
    coverage: ["Manufacturing defects", "Accidental damage", "Water damage", "Theft protection", "Same-day replacement", "Free diagnostics"],
    exclusions: ["Intentional damage", "Unauthorized modifications"],
    covered_items: ["Manufacturing defects", "Accidental damage", "Water damage", "Theft protection", "Same-day replacement"],
    excluded_items: ["Intentional damage", "Unauthorized modifications", "Cosmetic-only damage"],
    is_active: true,
    price: 9999,
    rating: 4.8,
    metadata: { thumbnail: "/seed-images/warranties/1589829545856-d10d557cf95f.jpg" },
    highlights: ["36-month coverage", "Same-day replacement", "Theft protection", "Water damage covered", "Zero deductible"],
    faq: [
      { question: "What is same-day replacement?", answer: "If your device qualifies, we'll ship a replacement the same day your claim is approved." },
      { question: "How does theft protection work?", answer: "File a police report and submit it with your claim. We'll replace your device within 48 hours." },
      { question: "Is water damage really covered?", answer: "Yes, accidental water damage including spills and submersion is fully covered." },
    ],
    claims_process: [
      { title: "Contact Support", description: "Call or chat with our premium support team (available 24/7)" },
      { title: "Instant Approval", description: "Premium claims are fast-tracked for same-day approval" },
      { title: "Same-Day Dispatch", description: "Replacement device shipped same day via express delivery" },
      { title: "Return Old Device", description: "Use the included return label to send back the damaged device" },
    ],
    reviews: [
      { author: "Sultan A.", rating: 5, comment: "Same-day replacement is incredible. Had a new device within hours.", created_at: "2024-11-10T07:00:00Z" },
      { author: "Amira G.", rating: 5, comment: "Phone was stolen, filed a claim with police report, got a replacement in 48 hours.", created_at: "2024-10-25T12:00:00Z" },
      { author: "Waleed D.", rating: 5, comment: "Spilled water on my laptop. Fully covered! This premium plan is amazing.", created_at: "2024-10-08T09:30:00Z" },
      { author: "Reem L.", rating: 4, comment: "Comprehensive coverage that truly covers everything. Premium is the way to go.", created_at: "2024-09-22T14:45:00Z" },
      { author: "Mazen T.", rating: 5, comment: "The best warranty plan available. Zero deductible and same-day service.", created_at: "2024-09-05T10:00:00Z" },
    ],
  },
  {
    id: "warranty-seed-4",
    name: "Extended MaxCare",
    description: "Our longest warranty plan with 4 years of full coverage. Includes annual maintenance and priority repair service.",
    plan_type: "extended",
    duration_months: 48,
    currency_code: "USD",
    coverage: ["All defects and failures", "Accidental damage", "Water damage", "Annual maintenance", "Priority repair", "Loaner device"],
    exclusions: ["Intentional damage"],
    covered_items: ["All defects and failures", "Accidental damage", "Water damage", "Annual maintenance", "Priority repair"],
    excluded_items: ["Intentional damage"],
    is_active: true,
    price: 14999,
    rating: 4.9,
    metadata: { thumbnail: "/seed-images/warranties/1506784983877-45594efa4cbe.jpg" },
    highlights: ["48-month coverage", "Annual maintenance included", "Loaner device provided", "Priority repair service", "Comprehensive protection"],
    faq: [
      { question: "What is the annual maintenance?", answer: "Once per year, send in your device for a professional cleaning, diagnostic check, and preventive maintenance at no extra cost." },
      { question: "How does the loaner program work?", answer: "While your device is being repaired, we provide a loaner device at no charge so you stay connected." },
      { question: "Can I cancel and get a refund?", answer: "You can cancel within the first 60 days for a full refund. After that, a prorated refund is available." },
    ],
    claims_process: [
      { title: "File Claim", description: "Submit your claim online or via our mobile app" },
      { title: "Receive Loaner", description: "A loaner device is shipped to you immediately" },
      { title: "Priority Repair", description: "Your device receives priority repair treatment" },
      { title: "Return & Enjoy", description: "Repaired device returned, loaner device collected" },
    ],
    reviews: [
      { author: "Bandar Q.", rating: 5, comment: "4 years of worry-free usage. The annual maintenance keeps my device running like new.", created_at: "2024-11-08T08:30:00Z" },
      { author: "Ghada J.", rating: 5, comment: "Loaner device during repair was a lifesaver. Never missed a beat.", created_at: "2024-10-22T11:00:00Z" },
      { author: "Hamza M.", rating: 5, comment: "Priority repair is no joke. Had my laptop back in 2 days.", created_at: "2024-10-06T13:15:00Z" },
      { author: "Dina B.", rating: 4, comment: "Excellent long-term warranty. The annual checkup caught an issue early.", created_at: "2024-09-18T09:45:00Z" },
      { author: "Youssef S.", rating: 5, comment: "Best warranty investment. Comprehensive coverage for 4 full years.", created_at: "2024-09-02T15:00:00Z" },
    ],
  },
  {
    id: "warranty-seed-5",
    name: "Home Appliance Guard",
    description: "Specialized warranty for home appliances. Covers refrigerators, washers, dryers, and kitchen appliances.",
    plan_type: "standard",
    duration_months: 24,
    currency_code: "USD",
    coverage: ["Mechanical failures", "Electrical component failures", "Compressor coverage", "Motor protection", "In-home service"],
    exclusions: ["Cosmetic damage", "Filter replacements", "Normal wear"],
    covered_items: ["Mechanical failures", "Electrical component failures", "Compressor coverage", "Motor protection", "In-home service"],
    excluded_items: ["Cosmetic damage", "Filter replacements", "Normal wear"],
    is_active: true,
    price: 7999,
    rating: 4.4,
    thumbnail: "/seed-images/warranties/1589829545856-d10d557cf95f.jpg",
    metadata: { thumbnail: "/seed-images/classifieds/1555041469-a586c61ea9bc.jpg" },
    highlights: ["24-month coverage", "In-home service", "Multiple appliance coverage", "No hidden fees"],
    faq: [
      { question: "Which appliances are covered?", answer: "Refrigerators, washers, dryers, dishwashers, ovens, and microwaves are all covered under this plan." },
      { question: "Do you come to my home for repairs?", answer: "Yes, all repairs are performed in your home by certified technicians at no extra charge." },
      { question: "What if my appliance needs to be replaced?", answer: "If repair costs exceed the appliance value, we'll provide a replacement allowance toward a new unit." },
    ],
    claims_process: [
      { title: "Call Support", description: "Report the issue to our home appliance support line" },
      { title: "Schedule Visit", description: "A certified technician will be scheduled within 48 hours" },
      { title: "In-Home Repair", description: "Technician repairs the appliance at your location" },
      { title: "Quality Check", description: "Follow-up to ensure the repair is satisfactory" },
    ],
    reviews: [
      { author: "Nasser K.", rating: 5, comment: "Our restaurant's refrigerator broke down. Technician came next day and fixed it.", created_at: "2024-11-06T07:30:00Z" },
      { author: "Mona R.", rating: 4, comment: "In-home service is very convenient. No need to haul heavy appliances.", created_at: "2024-10-20T10:00:00Z" },
      { author: "Sami H.", rating: 5, comment: "Covers multiple appliances under one plan. Saved us money compared to individual warranties.", created_at: "2024-10-04T14:30:00Z" },
      { author: "Layla F.", rating: 4, comment: "Washer motor was replaced quickly. Good warranty for home appliances.", created_at: "2024-09-16T08:00:00Z" },
      { author: "Rashid W.", rating: 5, comment: "Certified technicians who know what they're doing. Professional service.", created_at: "2024-09-01T12:15:00Z" },
    ],
  },
]

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const mod = req.scope.resolve("warranty") as any
    const { id } = req.params
    const [item] = await mod.listWarrantyPlans({ id }, { take: 1 })
    if (!item) {
      const seedItem = SEED_DATA.find((s) => s.id === id) || SEED_DATA[0]
      return res.json({ item: seedItem })
    }
    return res.json({ item })
  } catch (error: any) {
    const seedItem = SEED_DATA.find((s) => s.id === req.params.id) || SEED_DATA[0]
    return res.json({ item: seedItem })
  }
}
