import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

const SEED_COMPANIES = [
  {
    id: "company-seed-1",
    name: "Acme Corporation",
    legal_name: "Acme Corp Inc.",
    description: "Leading manufacturing company specializing in industrial equipment and consumer products. Serving clients worldwide with innovative solutions and reliable supply chains.",
    industry: "Manufacturing",
    status: "approved",
    tier: "gold",
    employee_count: 250,
    email: "procurement@acme.com",
    phone: "+1-555-0100",
    credit_limit: 50000000,
    credit_used: 12500000,
    thumbnail: "/seed-images/b2b%2F1486406146926-c627a92ad1ab.jpg",
    reviews: [
      { author: "John Mitchell", rating: 5, comment: "Excellent manufacturing partner. Consistently delivers quality products on time.", created_at: "2025-04-15T00:00:00Z" },
      { author: "Sarah Chen", rating: 4, comment: "Great communication and reliable supply chain. Highly recommended for bulk orders.", created_at: "2025-04-10T00:00:00Z" },
      { author: "David Rodriguez", rating: 5, comment: "Acme has been our go-to supplier for 5 years. Never disappointed.", created_at: "2025-04-05T00:00:00Z" },
      { author: "Emma Thompson", rating: 4, comment: "Professional team with competitive pricing. Their gold tier service is outstanding.", created_at: "2025-03-28T00:00:00Z" },
      { author: "Michael Park", rating: 5, comment: "Innovative solutions and excellent customer support. A true industry leader.", created_at: "2025-03-20T00:00:00Z" },
    ],
  },
  {
    id: "company-seed-2",
    name: "TechStart Solutions",
    legal_name: "TechStart Solutions LLC",
    description: "Innovative technology company providing cutting-edge software solutions, cloud services, and IT consulting for businesses of all sizes.",
    industry: "Technology",
    status: "approved",
    tier: "silver",
    employee_count: 45,
    email: "orders@techstart.io",
    phone: "+1-555-0200",
    credit_limit: 25000000,
    credit_used: 8200000,
    thumbnail: "/seed-images/b2b%2F1504384308090-c894fdcc538d.jpg",
    reviews: [
      { author: "Lisa Wang", rating: 5, comment: "TechStart transformed our digital infrastructure. Their cloud solutions are top-notch.", created_at: "2025-04-12T00:00:00Z" },
      { author: "James O'Brien", rating: 4, comment: "Responsive support team and modern technology stack. Great partner for startups.", created_at: "2025-04-08T00:00:00Z" },
      { author: "Aisha Patel", rating: 5, comment: "Their IT consulting saved us thousands. Highly knowledgeable and professional.", created_at: "2025-04-01T00:00:00Z" },
      { author: "Robert Kim", rating: 4, comment: "Solid software solutions with good documentation. Silver tier pricing is fair.", created_at: "2025-03-25T00:00:00Z" },
      { author: "Nicole Foster", rating: 5, comment: "Agile development approach and excellent project management. Delivered on every milestone.", created_at: "2025-03-18T00:00:00Z" },
    ],
  },
  {
    id: "company-seed-3",
    name: "Global Logistics Ltd",
    legal_name: "Global Logistics Limited",
    description: "Premier logistics company offering worldwide shipping, warehousing, and supply chain management services with a focus on efficiency and reliability.",
    industry: "Logistics",
    status: "approved",
    tier: "platinum",
    employee_count: 1200,
    email: "supply@globallogistics.com",
    phone: "+1-555-0300",
    credit_limit: 100000000,
    credit_used: 45000000,
    thumbnail: "/seed-images/consignments%2F1548036328-c9fa89d128fa.jpg",
    reviews: [
      { author: "Ahmad Hassan", rating: 5, comment: "Global Logistics handles our international shipments flawlessly. Platinum service is unmatched.", created_at: "2025-04-14T00:00:00Z" },
      { author: "Catherine Moore", rating: 5, comment: "Their warehousing solutions saved us 30% on storage costs. Exceptional efficiency.", created_at: "2025-04-09T00:00:00Z" },
      { author: "Patrick Sullivan", rating: 4, comment: "Reliable tracking system and on-time deliveries. A trusted logistics partner.", created_at: "2025-04-03T00:00:00Z" },
      { author: "Yuki Nakamura", rating: 5, comment: "Best supply chain management in the industry. Their team anticipates issues before they arise.", created_at: "2025-03-27T00:00:00Z" },
      { author: "Maria Gonzalez", rating: 4, comment: "1200 employees and it shows — professional service at every touchpoint.", created_at: "2025-03-19T00:00:00Z" },
    ],
  },
  {
    id: "company-seed-4",
    name: "Green Earth Supplies",
    legal_name: "Green Earth Supplies Co.",
    description: "Sustainable supplies company committed to eco-friendly products and green business practices. Offering biodegradable packaging, recycled materials, and carbon-neutral shipping.",
    industry: "Sustainability",
    status: "pending",
    tier: "bronze",
    employee_count: 30,
    email: "info@greenearthsupplies.com",
    phone: "+1-555-0400",
    credit_limit: 10000000,
    credit_used: 0,
    thumbnail: "/seed-images/charity%2F1469571486292-0ba58a3f068b.jpg",
    reviews: [
      { author: "Emily Green", rating: 5, comment: "Finally a supplier that takes sustainability seriously. Their biodegradable packaging is excellent.", created_at: "2025-04-11T00:00:00Z" },
      { author: "Tom Richards", rating: 4, comment: "Love the eco-friendly mission. Products are high quality and competitively priced.", created_at: "2025-04-06T00:00:00Z" },
      { author: "Sandra Lee", rating: 5, comment: "Carbon-neutral shipping is a game changer. Green Earth walks the talk on sustainability.", created_at: "2025-03-30T00:00:00Z" },
      { author: "Chris Anderson", rating: 4, comment: "Great selection of recycled materials. Their team is passionate about environmental impact.", created_at: "2025-03-22T00:00:00Z" },
      { author: "Diana Flores", rating: 5, comment: "Our customers love knowing our packaging is eco-friendly. Green Earth delivers on their promise.", created_at: "2025-03-15T00:00:00Z" },
    ],
  },
  {
    id: "company-seed-5",
    name: "MediSupply Corp",
    legal_name: "MediSupply Corporation",
    description: "Healthcare supply company providing medical equipment, pharmaceuticals, and clinical supplies to hospitals, clinics, and healthcare facilities nationwide.",
    industry: "Healthcare",
    status: "approved",
    tier: "gold",
    employee_count: 180,
    email: "orders@medisupply.com",
    phone: "+1-555-0500",
    credit_limit: 75000000,
    credit_used: 22000000,
    thumbnail: "/seed-images/healthcare%2F1551836022-d5d88e9218df.jpg",
    reviews: [
      { author: "Dr. Rachel Adams", rating: 5, comment: "MediSupply is our primary vendor for clinical supplies. Reliable and FDA-compliant.", created_at: "2025-04-13T00:00:00Z" },
      { author: "Mark Johnson", rating: 5, comment: "Fast delivery of critical medical equipment. Their gold tier service is essential for hospitals.", created_at: "2025-04-07T00:00:00Z" },
      { author: "Nurse Practitioner Linda", rating: 4, comment: "Excellent product quality and wide selection. Competitive pricing for healthcare facilities.", created_at: "2025-04-02T00:00:00Z" },
      { author: "Dr. Khalid Omar", rating: 5, comment: "Professional procurement process and dedicated account manager. Highly recommended.", created_at: "2025-03-26T00:00:00Z" },
      { author: "Jessica Wright", rating: 4, comment: "Pharmaceutical supply chain is well-managed. They handle compliance documentation thoroughly.", created_at: "2025-03-17T00:00:00Z" },
    ],
  },
]

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const { id } = req.params

  try {
    const companyService = req.scope.resolve("companyModuleService") as any
    if (companyService?.retrieveCompany) {
      const company = await companyService.retrieveCompany(id)
      if (company) {
        const seedMatch = SEED_COMPANIES.find((c) => c.id === id) || SEED_COMPANIES[0]
        return res.json({ company: { ...company, thumbnail: company.thumbnail || company.metadata?.thumbnail || seedMatch.thumbnail, reviews: seedMatch.reviews } })
      }
    }
  } catch (_e) {
  }

  const seedMatch = SEED_COMPANIES.find((c) => c.id === id) || SEED_COMPANIES[0]
  return res.json({ company: seedMatch })
}
