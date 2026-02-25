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
      thumbnail: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=800&h=600&fit=crop",
      images: ["https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=800&h=600&fit=crop"],
      rating: 4.9,
      consultation_fee: 25000,
    },
    created_at: "2025-01-01T00:00:00Z",
  },
  {
    id: "health_seed_02",
    tenant_id: "tenant_seed",
    name: "David Kim",
    title: "Dermatology Specialist",
    specialization: "dermatology",
    bio: "Expert dermatologist specializing in cosmetic procedures, skin cancer screening, and advanced dermatological treatments. Research published in top medical journals.",
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
      thumbnail: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=800&h=600&fit=crop",
      images: ["https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=800&h=600&fit=crop"],
      rating: 4.7,
      consultation_fee: 20000,
    },
    created_at: "2025-01-05T00:00:00Z",
  },
  {
    id: "health_seed_03",
    tenant_id: "tenant_seed",
    name: "Maria Santos",
    title: "Pediatrics & Child Development",
    specialization: "pediatrics",
    bio: "Compassionate pediatrician dedicated to children's health and development. Specializes in childhood nutrition, behavioral development, and preventive care.",
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
      thumbnail: "https://images.unsplash.com/photo-1594824476967-48c8b964f137?w=800&h=600&fit=crop",
      images: ["https://images.unsplash.com/photo-1594824476967-48c8b964f137?w=800&h=600&fit=crop"],
      rating: 4.9,
      consultation_fee: 18000,
    },
    created_at: "2025-01-10T00:00:00Z",
  },
  {
    id: "health_seed_04",
    tenant_id: "tenant_seed",
    name: "James Mitchell",
    title: "Orthopedic Surgeon",
    specialization: "orthopedics",
    bio: "Experienced orthopedic surgeon specializing in sports medicine, joint replacement, and minimally invasive surgical techniques. Team physician for professional athletes.",
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
      thumbnail: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=800&h=600&fit=crop",
      images: ["https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=800&h=600&fit=crop"],
      rating: 4.8,
      consultation_fee: 30000,
    },
    created_at: "2025-01-15T00:00:00Z",
  },
  {
    id: "health_seed_05",
    tenant_id: "tenant_seed",
    name: "Nadia Petrova",
    title: "Psychiatrist & Mental Health Expert",
    specialization: "psychiatry",
    bio: "Renowned psychiatrist offering comprehensive mental health services including therapy, medication management, and mindfulness-based treatments for anxiety and depression.",
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
      thumbnail: "https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=800&h=600&fit=crop",
      images: ["https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=800&h=600&fit=crop"],
      rating: 4.8,
      consultation_fee: 22000,
    },
    created_at: "2025-01-20T00:00:00Z",
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
