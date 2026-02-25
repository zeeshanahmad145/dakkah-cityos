import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { handleApiError } from "../../../../lib/api-error-handler"

const SEED_DATA = [
  {
    id: "legal_seed_01",
    tenant_id: "tenant_seed",
    name: "Elizabeth Warren-Clarke",
    bar_number: "CA-287451",
    specializations: ["corporate", "intellectual_property"],
    practice_areas: ["Corporate Law", "IP Protection", "Mergers & Acquisitions"],
    bio: "Senior corporate attorney with extensive experience in M&A transactions, intellectual property protection, and business formation. Represented Fortune 500 companies in landmark cases.",
    education: "JD, Yale Law School",
    experience_years: 22,
    currency_code: "USD",
    hourly_rate: 45000,
    location: "Financial District, NYC",
    rating: 4.9,
    consultation_available: true,
    is_active: true,
    metadata: {
      thumbnail: "https://images.unsplash.com/photo-1589578527966-fdac0f44566c?w=800&h=600&fit=crop",
      images: ["https://images.unsplash.com/photo-1589578527966-fdac0f44566c?w=800&h=600&fit=crop"],
      rating: 4.9,
      hourly_rate: 45000,
    },
    created_at: "2025-01-01T00:00:00Z",
  },
  {
    id: "legal_seed_02",
    tenant_id: "tenant_seed",
    name: "Marcus Thompson",
    bar_number: "NY-394822",
    specializations: ["criminal"],
    practice_areas: ["Criminal Defense", "White Collar Crime", "Appeals"],
    bio: "Renowned criminal defense attorney known for meticulous case preparation and compelling courtroom presence. Successfully defended clients in over 200 cases with a 92% acquittal rate.",
    education: "JD, Harvard Law School",
    experience_years: 18,
    currency_code: "USD",
    hourly_rate: 50000,
    location: "Midtown Manhattan, NYC",
    rating: 4.8,
    consultation_available: true,
    is_active: true,
    metadata: {
      thumbnail: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=600&fit=crop",
      images: ["https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=600&fit=crop"],
      rating: 4.8,
      hourly_rate: 50000,
    },
    created_at: "2025-01-05T00:00:00Z",
  },
  {
    id: "legal_seed_03",
    tenant_id: "tenant_seed",
    name: "Sofia Rodriguez",
    bar_number: "TX-512093",
    specializations: ["family", "immigration"],
    practice_areas: ["Family Law", "Immigration", "Child Custody", "Divorce"],
    bio: "Compassionate family and immigration attorney dedicated to protecting families and helping individuals navigate complex legal processes. Bilingual practice serving diverse communities.",
    education: "JD, Georgetown University",
    experience_years: 14,
    currency_code: "USD",
    hourly_rate: 35000,
    location: "Austin, TX",
    rating: 4.9,
    consultation_available: true,
    is_active: true,
    metadata: {
      thumbnail: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800&h=600&fit=crop",
      images: ["https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800&h=600&fit=crop"],
      rating: 4.9,
      hourly_rate: 35000,
    },
    created_at: "2025-01-10T00:00:00Z",
  },
  {
    id: "legal_seed_04",
    tenant_id: "tenant_seed",
    name: "Richard Park",
    bar_number: "CA-618734",
    specializations: ["real_estate"],
    practice_areas: ["Real Estate Law", "Property Disputes", "Commercial Leasing", "Zoning"],
    bio: "Expert real estate attorney handling residential and commercial property transactions, zoning disputes, and landlord-tenant matters. Trusted advisor for major development projects.",
    education: "JD, UC Berkeley School of Law",
    experience_years: 16,
    currency_code: "USD",
    hourly_rate: 40000,
    location: "San Francisco, CA",
    rating: 4.7,
    consultation_available: true,
    is_active: true,
    metadata: {
      thumbnail: "https://images.unsplash.com/photo-1556157382-97eda2d62296?w=800&h=600&fit=crop",
      images: ["https://images.unsplash.com/photo-1556157382-97eda2d62296?w=800&h=600&fit=crop"],
      rating: 4.7,
      hourly_rate: 40000,
    },
    created_at: "2025-01-15T00:00:00Z",
  },
  {
    id: "legal_seed_05",
    tenant_id: "tenant_seed",
    name: "Aisha Patel",
    bar_number: "IL-729561",
    specializations: ["intellectual_property", "corporate"],
    practice_areas: ["Patent Law", "Trademark Registration", "Tech Startup Law", "IP Litigation"],
    bio: "Tech-savvy IP attorney specializing in patent prosecution, trademark protection, and startup legal strategy. Helped over 150 startups protect their innovations and scale their businesses.",
    education: "JD, Stanford Law School",
    experience_years: 11,
    currency_code: "USD",
    hourly_rate: 38000,
    location: "Chicago, IL",
    rating: 4.8,
    consultation_available: true,
    is_active: true,
    metadata: {
      thumbnail: "https://images.unsplash.com/photo-1580894732444-8ecded7900cd?w=800&h=600&fit=crop",
      images: ["https://images.unsplash.com/photo-1580894732444-8ecded7900cd?w=800&h=600&fit=crop"],
      rating: 4.8,
      hourly_rate: 38000,
    },
    created_at: "2025-01-20T00:00:00Z",
  },
]

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const { id } = req.params

  try {
    const mod = req.scope.resolve("legal") as any
    const item = await mod.retrieveAttorneyProfile(id)
    if (item) return res.json({ item })
  } catch (error: any) {
    const isNotFound = error?.type === "not_found" || error?.message?.includes("not found")
    if (!isNotFound) {
      return handleApiError(res, error, "STORE-LEGAL-ID")
    }
  }

  const seedMatch = SEED_DATA.find((c) => c.id === id) || SEED_DATA[0]
  return res.json({ item: seedMatch })
}
