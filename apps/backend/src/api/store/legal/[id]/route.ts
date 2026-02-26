import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { handleApiError } from "../../../../lib/api-error-handler"
import { enrichDetailItem } from "../../../../lib/detail-enricher"

const SEED_DATA = [
  {
    id: "legal_seed_01",
    tenant_id: "tenant_seed",
    name: "Elizabeth Warren-Clarke",
    bar_number: "CA-287451",
    specializations: ["corporate", "intellectual_property"],
    practice_areas: ["Corporate Law", "IP Protection", "Mergers & Acquisitions"],
    bio: "Senior corporate attorney with extensive experience in M&A transactions, intellectual property protection, and business formation. Represented Fortune 500 companies in landmark cases.",
    description: "Senior corporate attorney with extensive experience in M&A transactions, intellectual property protection, and business formation. Represented Fortune 500 companies in landmark cases.",
    education: "JD, Yale Law School",
    experience_years: 22,
    currency_code: "USD",
    hourly_rate: 45000,
    location: "Financial District, NYC",
    rating: 4.9,
    consultation_available: true,
    is_active: true,
    thumbnail: "/seed-images/legal/1589578527966-fdac0f44566c.jpg",
    metadata: {
      thumbnail: "/seed-images/legal/1589578527966-fdac0f44566c.jpg",
      images: ["/seed-images/legal/1589578527966-fdac0f44566c.jpg"],
      rating: 4.9,
      hourly_rate: 45000,
    },
    created_at: "2025-01-01T00:00:00Z",
    case_types: ["Mergers & Acquisitions", "Corporate Formation", "Patent Prosecution", "Trademark Registration", "Securities Regulation", "Contract Disputes"],
    bar_associations: ["New York State Bar Association", "American Bar Association", "International Bar Association"],
    languages: ["English", "Mandarin"],
    office_locations: [
      { name: "Financial District Office", address: "100 Wall Street, Suite 2500, New York, NY 10005", hours: "Mon-Fri 8:00 AM - 7:00 PM" },
      { name: "Midtown Office", address: "450 Lexington Ave, Floor 30, New York, NY 10017", hours: "Mon-Fri 9:00 AM - 6:00 PM" },
    ],
    reviews: [
      { author: "Robert C.", rating: 5, comment: "Elizabeth handled our M&A transaction flawlessly. Her attention to detail and negotiation skills are exceptional.", created_at: "2025-04-10T10:00:00Z" },
      { author: "Wei Z.", rating: 5, comment: "Best IP attorney in NYC. Protected our patents and trademarks with thorough, strategic counsel.", created_at: "2025-03-28T14:00:00Z" },
      { author: "Sarah K.", rating: 4, comment: "Highly professional and responsive. Her corporate formation advice saved our startup significant time and money.", created_at: "2025-03-15T11:30:00Z" },
      { author: "James P.", rating: 5, comment: "22 years of experience shows in every consultation. She anticipates legal issues before they arise.", created_at: "2025-02-20T09:00:00Z" },
      { author: "Linda M.", rating: 5, comment: "Elizabeth's bilingual ability was invaluable for our cross-border deal with Chinese partners. Outstanding results.", created_at: "2025-02-05T13:00:00Z" },
    ],
  },
  {
    id: "legal_seed_02",
    tenant_id: "tenant_seed",
    name: "Marcus Thompson",
    bar_number: "NY-394822",
    specializations: ["criminal"],
    practice_areas: ["Criminal Defense", "White Collar Crime", "Appeals"],
    bio: "Renowned criminal defense attorney known for meticulous case preparation and compelling courtroom presence. Successfully defended clients in over 200 cases with a 92% acquittal rate.",
    description: "Renowned criminal defense attorney known for meticulous case preparation and compelling courtroom presence. Successfully defended clients in over 200 cases with a 92% acquittal rate.",
    education: "JD, Harvard Law School",
    experience_years: 18,
    currency_code: "USD",
    hourly_rate: 50000,
    location: "Midtown Manhattan, NYC",
    rating: 4.8,
    consultation_available: true,
    is_active: true,
    thumbnail: "/seed-images/legal/1507003211169-0a1dd7228f2d.jpg",
    metadata: {
      thumbnail: "/seed-images/legal/1507003211169-0a1dd7228f2d.jpg",
      images: ["/seed-images/legal/1507003211169-0a1dd7228f2d.jpg"],
      rating: 4.8,
      hourly_rate: 50000,
    },
    created_at: "2025-01-05T00:00:00Z",
    case_types: ["Criminal Defense", "White Collar Crime", "Appeals", "DUI Defense", "Federal Crimes", "Juvenile Defense"],
    bar_associations: ["New York State Bar Association", "National Association of Criminal Defense Lawyers"],
    languages: ["English"],
    office_locations: [
      { name: "Midtown Manhattan Office", address: "1345 6th Avenue, Suite 800, New York, NY 10105", hours: "Mon-Fri 8:00 AM - 8:00 PM" },
    ],
    reviews: [
      { author: "Anonymous Client", rating: 5, comment: "Marcus's courtroom presence is commanding. His preparation was meticulous and the outcome exceeded expectations.", created_at: "2025-04-08T16:00:00Z" },
      { author: "Jennifer R.", rating: 5, comment: "Hired Marcus for an appeals case and he was brilliant. His legal arguments were compelling and well-researched.", created_at: "2025-03-25T11:00:00Z" },
      { author: "David S.", rating: 4, comment: "92% acquittal rate speaks for itself. Professional, thorough, and always available when I needed guidance.", created_at: "2025-03-10T14:30:00Z" },
      { author: "Michelle T.", rating: 5, comment: "Marcus took my white collar case when others wouldn't. His Harvard training and experience made all the difference.", created_at: "2025-02-22T10:00:00Z" },
      { author: "Alex W.", rating: 5, comment: "Incredible defense attorney who truly cares about his clients. His preparation for trial was extraordinary.", created_at: "2025-02-08T15:00:00Z" },
    ],
  },
  {
    id: "legal_seed_03",
    tenant_id: "tenant_seed",
    name: "Sofia Rodriguez",
    bar_number: "TX-512093",
    specializations: ["family", "immigration"],
    practice_areas: ["Family Law", "Immigration", "Child Custody", "Divorce"],
    bio: "Compassionate family and immigration attorney dedicated to protecting families and helping individuals navigate complex legal processes. Bilingual practice serving diverse communities.",
    description: "Compassionate family and immigration attorney dedicated to protecting families and helping individuals navigate complex legal processes. Bilingual practice serving diverse communities.",
    education: "JD, Georgetown University",
    experience_years: 14,
    currency_code: "USD",
    hourly_rate: 35000,
    location: "Austin, TX",
    rating: 4.9,
    consultation_available: true,
    is_active: true,
    thumbnail: "/seed-images/legal/1573496359142-b8d87734a5a2.jpg",
    metadata: {
      thumbnail: "/seed-images/legal/1573496359142-b8d87734a5a2.jpg",
      images: ["/seed-images/legal/1573496359142-b8d87734a5a2.jpg"],
      rating: 4.9,
      hourly_rate: 35000,
    },
    created_at: "2025-01-10T00:00:00Z",
    case_types: ["Family Law", "Immigration", "Child Custody", "Divorce", "Adoption", "Visa Applications"],
    bar_associations: ["State Bar of Texas", "American Immigration Lawyers Association"],
    languages: ["English", "Spanish", "Portuguese"],
    office_locations: [
      { name: "Austin Office", address: "300 West 6th Street, Suite 1200, Austin, TX 78701", hours: "Mon-Fri 9:00 AM - 6:00 PM" },
      { name: "San Antonio Office", address: "112 East Pecan Street, Suite 900, San Antonio, TX 78205", hours: "Mon-Thu 9:00 AM - 5:00 PM" },
    ],
    reviews: [
      { author: "Maria G.", rating: 5, comment: "Sofia handled our immigration case with such compassion and expertise. She made a stressful process manageable.", created_at: "2025-04-06T09:00:00Z" },
      { author: "Carlos R.", rating: 5, comment: "Her bilingual practice was essential for my family. She explained everything clearly in Spanish and fought for us.", created_at: "2025-03-22T10:30:00Z" },
      { author: "Jennifer P.", rating: 5, comment: "Sofia's child custody expertise helped reach an amicable agreement. She always prioritized our children's wellbeing.", created_at: "2025-03-08T14:00:00Z" },
      { author: "Antonio M.", rating: 4, comment: "Responsive and knowledgeable immigration attorney. Her Georgetown education and 14 years of experience show.", created_at: "2025-02-20T11:00:00Z" },
      { author: "Rachel S.", rating: 5, comment: "Successfully handled our adoption case. Sofia's dedication to families is genuine and her legal skills are top-notch.", created_at: "2025-02-05T08:30:00Z" },
    ],
  },
  {
    id: "legal_seed_04",
    tenant_id: "tenant_seed",
    name: "Richard Park",
    bar_number: "CA-618734",
    specializations: ["real_estate"],
    practice_areas: ["Real Estate Law", "Property Disputes", "Commercial Leasing", "Zoning"],
    bio: "Expert real estate attorney handling residential and commercial property transactions, zoning disputes, and landlord-tenant matters. Trusted advisor for major development projects.",
    description: "Expert real estate attorney handling residential and commercial property transactions, zoning disputes, and landlord-tenant matters. Trusted advisor for major development projects.",
    education: "JD, UC Berkeley School of Law",
    experience_years: 16,
    currency_code: "USD",
    hourly_rate: 40000,
    location: "San Francisco, CA",
    rating: 4.7,
    consultation_available: true,
    is_active: true,
    thumbnail: "/seed-images/legal/1556157382-97eda2d62296.jpg",
    metadata: {
      thumbnail: "/seed-images/legal/1556157382-97eda2d62296.jpg",
      images: ["/seed-images/legal/1556157382-97eda2d62296.jpg"],
      rating: 4.7,
      hourly_rate: 40000,
    },
    created_at: "2025-01-15T00:00:00Z",
    case_types: ["Real Estate Transactions", "Property Disputes", "Commercial Leasing", "Zoning Appeals", "Title Issues", "Landlord-Tenant Disputes"],
    bar_associations: ["State Bar of California", "American College of Real Estate Lawyers"],
    languages: ["English", "Korean"],
    office_locations: [
      { name: "San Francisco Office", address: "555 California Street, Suite 4000, San Francisco, CA 94104", hours: "Mon-Fri 8:30 AM - 6:30 PM" },
    ],
    reviews: [
      { author: "Karen L.", rating: 5, comment: "Richard navigated our complex commercial lease negotiation expertly. Saved us thousands in unfavorable terms.", created_at: "2025-04-09T10:00:00Z" },
      { author: "Daniel W.", rating: 4, comment: "Handled our property dispute professionally. His knowledge of SF real estate law is comprehensive.", created_at: "2025-03-26T13:00:00Z" },
      { author: "Susan J.", rating: 4, comment: "Richard's zoning appeal expertise got our development project approved. Thorough preparation and strong advocacy.", created_at: "2025-03-12T09:30:00Z" },
      { author: "Min-Jun K.", rating: 5, comment: "Korean-speaking real estate attorney in SF was exactly what we needed. Title issues resolved smoothly.", created_at: "2025-02-25T11:00:00Z" },
      { author: "Brian H.", rating: 4, comment: "Reliable and knowledgeable. Richard handled our residential purchase from contract review to closing efficiently.", created_at: "2025-02-10T14:30:00Z" },
    ],
  },
  {
    id: "legal_seed_05",
    tenant_id: "tenant_seed",
    name: "Aisha Patel",
    bar_number: "IL-729561",
    specializations: ["intellectual_property", "corporate"],
    practice_areas: ["Patent Law", "Trademark Registration", "Tech Startup Law", "IP Litigation"],
    bio: "Tech-savvy IP attorney specializing in patent prosecution, trademark protection, and startup legal strategy. Helped over 150 startups protect their innovations and scale their businesses.",
    description: "Tech-savvy IP attorney specializing in patent prosecution, trademark protection, and startup legal strategy. Helped over 150 startups protect their innovations and scale their businesses.",
    education: "JD, Stanford Law School",
    experience_years: 11,
    currency_code: "USD",
    hourly_rate: 38000,
    location: "Chicago, IL",
    rating: 4.8,
    consultation_available: true,
    is_active: true,
    thumbnail: "/seed-images/legal/1580894732444-8ecded7900cd.jpg",
    metadata: {
      thumbnail: "/seed-images/legal/1580894732444-8ecded7900cd.jpg",
      images: ["/seed-images/legal/1580894732444-8ecded7900cd.jpg"],
      rating: 4.8,
      hourly_rate: 38000,
    },
    created_at: "2025-01-20T00:00:00Z",
    case_types: ["Patent Law", "Trademark Registration", "IP Litigation", "Trade Secrets", "Licensing Agreements", "Startup Legal Strategy"],
    bar_associations: ["Illinois State Bar Association", "American Intellectual Property Law Association", "International Trademark Association"],
    languages: ["English", "Hindi", "Gujarati"],
    office_locations: [
      { name: "Chicago Loop Office", address: "233 South Wacker Drive, Suite 6100, Chicago, IL 60606", hours: "Mon-Fri 8:00 AM - 6:00 PM" },
      { name: "Evanston Office", address: "1800 Sherman Avenue, Suite 200, Evanston, IL 60201", hours: "Tue-Thu 10:00 AM - 4:00 PM" },
    ],
    reviews: [
      { author: "Raj P.", rating: 5, comment: "Aisha protected our startup's IP portfolio brilliantly. Her tech background means she actually understands our product.", created_at: "2025-04-11T11:00:00Z" },
      { author: "Emily C.", rating: 5, comment: "Filed our patent application and it was approved on the first submission. Aisha's preparation was impeccable.", created_at: "2025-03-29T10:00:00Z" },
      { author: "Mark S.", rating: 4, comment: "Great trademark registration service. She identified potential conflicts early and saved us from costly disputes.", created_at: "2025-03-14T14:00:00Z" },
      { author: "Priya N.", rating: 5, comment: "Her multilingual practice and understanding of international IP law helped us expand globally with confidence.", created_at: "2025-02-28T09:30:00Z" },
      { author: "Jason T.", rating: 5, comment: "Helped our Series A startup with legal strategy and IP protection. 150+ startups served is clear from her expertise.", created_at: "2025-02-12T13:00:00Z" },
    ],
  },
]

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const { id } = req.params

  try {
    const mod = req.scope.resolve("legal") as any
    const item = await mod.retrieveAttorneyProfile(id)
    if (item) return res.json({ item: enrichDetailItem(item, "legal") })
  } catch (error: any) {
    const isNotFound = error?.type === "not_found" || error?.message?.includes("not found")
    if (!isNotFound) {
      return handleApiError(res, error, "STORE-LEGAL-ID")
    }
  }

  const seedMatch = SEED_DATA.find((c) => c.id === id) || SEED_DATA[0]
  return res.json({ item: seedMatch })
}
