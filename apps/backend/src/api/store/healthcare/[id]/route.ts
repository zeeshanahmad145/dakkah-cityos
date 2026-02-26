import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { handleApiError } from "../../../../lib/api-error-handler"

const SEED_DATA = [
  {
    id: "health_seed_01",
    tenant_id: "tenant_seed",
    name: "Amira Hassan",
    title: "Board Certified Cardiologist",
    specialization: "cardiology",
    bio: "Leading cardiologist with over 15 years of experience in interventional cardiology and heart failure management. Passionate about preventive cardiac care.",
    description: "Leading cardiologist with over 15 years of experience in interventional cardiology and heart failure management. Passionate about preventive cardiac care.",
    education: "MD, Johns Hopkins University",
    experience_years: 15,
    languages: ["English", "Arabic"],
    is_accepting_patients: true,
    is_active: true,
    consultation_fee: 25000,
    currency_code: "USD",
    location: "Downtown Medical Center",
    rating: 4.9,
    metadata: {
      thumbnail: "/seed-images/government%2F1559839734-2b71ea197ec2.jpg",
      images: ["/seed-images/government%2F1559839734-2b71ea197ec2.jpg"],
      rating: 4.9,
      consultation_fee: 25000,
    },
    created_at: "2025-01-01T00:00:00Z",
    services: ["Interventional Cardiology", "Heart Failure Management", "Cardiac Catheterization", "Echocardiography", "Preventive Cardiac Care", "Stress Testing"],
    insurance_accepted: ["Bupa", "Tawuniya", "Medgulf", "AXA", "Cigna", "United Healthcare"],
    availability: [
      { day: "Monday", time: "9:00 AM - 1:00 PM" },
      { day: "Wednesday", time: "2:00 PM - 6:00 PM" },
      { day: "Thursday", time: "9:00 AM - 12:00 PM" },
    ],
  },
  {
    id: "health_seed_02",
    tenant_id: "tenant_seed",
    name: "David Kim",
    title: "Dermatology Specialist",
    specialization: "dermatology",
    bio: "Expert dermatologist specializing in cosmetic procedures, skin cancer screening, and advanced dermatological treatments. Research published in top medical journals.",
    description: "Expert dermatologist specializing in cosmetic procedures, skin cancer screening, and advanced dermatological treatments. Research published in top medical journals.",
    education: "MD, Stanford University",
    experience_years: 12,
    languages: ["English", "Korean"],
    is_accepting_patients: true,
    is_active: true,
    consultation_fee: 20000,
    currency_code: "USD",
    location: "Westside Skin Clinic",
    rating: 4.7,
    metadata: {
      thumbnail: "/seed-images/healthcare%2F1612349317150-e413f6a5b16d.jpg",
      images: ["/seed-images/healthcare%2F1612349317150-e413f6a5b16d.jpg"],
      rating: 4.7,
      consultation_fee: 20000,
    },
    created_at: "2025-01-05T00:00:00Z",
    services: ["Cosmetic Dermatology", "Skin Cancer Screening", "Laser Treatments", "Acne Treatment", "Botox & Fillers", "Chemical Peels"],
    insurance_accepted: ["Bupa", "Tawuniya", "AXA", "Allianz"],
    availability: [
      { day: "Tuesday", time: "10:00 AM - 4:00 PM" },
      { day: "Thursday", time: "10:00 AM - 4:00 PM" },
      { day: "Saturday", time: "9:00 AM - 1:00 PM" },
    ],
  },
  {
    id: "health_seed_03",
    tenant_id: "tenant_seed",
    name: "Maria Santos",
    title: "Pediatrics & Child Development",
    specialization: "pediatrics",
    bio: "Compassionate pediatrician dedicated to children's health and development. Specializes in childhood nutrition, behavioral development, and preventive care.",
    description: "Compassionate pediatrician dedicated to children's health and development. Specializes in childhood nutrition, behavioral development, and preventive care.",
    education: "MD, Harvard Medical School",
    experience_years: 18,
    languages: ["English", "Spanish", "Portuguese"],
    is_accepting_patients: true,
    is_active: true,
    consultation_fee: 18000,
    currency_code: "USD",
    location: "Family Health Center",
    rating: 4.9,
    metadata: {
      thumbnail: "/seed-images/healthcare%2F1576091160399-112ba8d25d1d.jpg",
      images: ["/seed-images/healthcare%2F1576091160399-112ba8d25d1d.jpg"],
      rating: 4.9,
      consultation_fee: 18000,
    },
    created_at: "2025-01-10T00:00:00Z",
    services: ["Well-child Visits", "Childhood Nutrition", "Behavioral Development", "Vaccinations", "Growth Monitoring", "Developmental Screening"],
    insurance_accepted: ["Bupa", "Tawuniya", "Medgulf", "Cigna", "MetLife"],
    availability: [
      { day: "Monday", time: "8:00 AM - 3:00 PM" },
      { day: "Wednesday", time: "8:00 AM - 3:00 PM" },
      { day: "Friday", time: "9:00 AM - 12:00 PM" },
    ],
  },
  {
    id: "health_seed_04",
    tenant_id: "tenant_seed",
    name: "James Mitchell",
    title: "Orthopedic Surgeon",
    specialization: "orthopedics",
    bio: "Experienced orthopedic surgeon specializing in sports medicine, joint replacement, and minimally invasive surgical techniques. Team physician for professional athletes.",
    description: "Experienced orthopedic surgeon specializing in sports medicine, joint replacement, and minimally invasive surgical techniques. Team physician for professional athletes.",
    education: "MD, Mayo Clinic",
    experience_years: 20,
    languages: ["English"],
    is_accepting_patients: true,
    is_active: true,
    consultation_fee: 30000,
    currency_code: "USD",
    location: "Sports Medicine Institute",
    rating: 4.8,
    metadata: {
      thumbnail: "/seed-images/healthcare%2F1622253692010-333f2da6031d.jpg",
      images: ["/seed-images/healthcare%2F1622253692010-333f2da6031d.jpg"],
      rating: 4.8,
      consultation_fee: 30000,
    },
    created_at: "2025-01-15T00:00:00Z",
    services: ["Sports Medicine", "Joint Replacement", "Arthroscopy", "Fracture Treatment", "Spine Surgery", "Physical Rehabilitation"],
    insurance_accepted: ["Bupa", "Tawuniya", "AXA", "Cigna", "Aetna"],
    availability: [
      { day: "Monday", time: "7:00 AM - 2:00 PM" },
      { day: "Thursday", time: "7:00 AM - 2:00 PM" },
      { day: "Saturday", time: "8:00 AM - 12:00 PM" },
    ],
  },
  {
    id: "health_seed_05",
    tenant_id: "tenant_seed",
    name: "Nadia Petrova",
    title: "Psychiatrist & Mental Health Expert",
    specialization: "psychiatry",
    bio: "Renowned psychiatrist offering comprehensive mental health services including therapy, medication management, and mindfulness-based treatments for anxiety and depression.",
    description: "Renowned psychiatrist offering comprehensive mental health services including therapy, medication management, and mindfulness-based treatments for anxiety and depression.",
    education: "MD, Columbia University",
    experience_years: 14,
    languages: ["English", "Russian", "French"],
    is_accepting_patients: true,
    is_active: true,
    consultation_fee: 22000,
    currency_code: "USD",
    location: "Mind & Wellness Center",
    rating: 4.8,
    metadata: {
      thumbnail: "/seed-images/healthcare%2F1551836022-d5d88e9218df.jpg",
      images: ["/seed-images/healthcare%2F1551836022-d5d88e9218df.jpg"],
      rating: 4.8,
      consultation_fee: 22000,
    },
    created_at: "2025-01-20T00:00:00Z",
    services: ["Cognitive Behavioral Therapy", "Medication Management", "Anxiety Treatment", "Depression Treatment", "Mindfulness Therapy", "Couples Counseling"],
    insurance_accepted: ["Bupa", "Tawuniya", "Cigna", "United Healthcare", "Aetna"],
    availability: [
      { day: "Tuesday", time: "10:00 AM - 6:00 PM" },
      { day: "Wednesday", time: "10:00 AM - 6:00 PM" },
      { day: "Friday", time: "10:00 AM - 2:00 PM" },
    ],
  },
]

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const { id } = req.params

  try {
    const mod = req.scope.resolve("healthcare") as any
    const item = await mod.retrievePractitioner(id)
    if (item) return res.json({ item })
  } catch (error: any) {
    const isNotFound = error?.type === "not_found" || error?.message?.includes("not found")
    if (!isNotFound) {
      return handleApiError(res, error, "STORE-HEALTHCARE-ID")
    }
  }

  const seedMatch = SEED_DATA.find((c) => c.id === id) || SEED_DATA[0]
  return res.json({ item: seedMatch })
}
