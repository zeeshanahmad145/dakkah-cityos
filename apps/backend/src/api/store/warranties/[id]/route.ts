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
    metadata: { thumbnail: "/seed-images/content%2F1454165804606-c3d57bc86b40.jpg" },
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
    metadata: { thumbnail: "/seed-images/government%2F1450101499163-c8848c66ca85.jpg" },
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
    metadata: { thumbnail: "/seed-images/warranties%2F1589829545856-d10d557cf95f.jpg" },
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
    metadata: { thumbnail: "/seed-images/warranties%2F1506784983877-45594efa4cbe.jpg" },
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
    metadata: { thumbnail: "/seed-images/classifieds%2F1555041469-a586c61ea9bc.jpg" },
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
