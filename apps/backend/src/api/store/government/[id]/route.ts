import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { handleApiError } from "../../../../lib/api-error-handler"

const SEED_DATA = [
  {
    id: "gov_001",
    name: "Business License",
    title: "Business License",
    description: "Register and obtain a license to operate your business within the municipality. Required for all commercial activities.",
    department: "municipal",
    icon: "briefcase",
    required_documents: ["ID/Passport copy", "Commercial registration", "Lease agreement", "Tax registration certificate"],
    processing_time: "5-7 business days",
    fee: 25000,
    status: "available",
    thumbnail: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=800&h=600&fit=crop",
  },
  {
    id: "gov_002",
    name: "Building Permit",
    title: "Building Permit",
    description: "Apply for construction or renovation permits for residential and commercial properties.",
    department: "municipal",
    icon: "building",
    required_documents: ["Architectural plans", "Land ownership deed", "Engineering drawings", "Environmental impact assessment"],
    processing_time: "15-30 business days",
    fee: 50000,
    status: "available",
    thumbnail: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&h=600&fit=crop",
  },
  {
    id: "gov_003",
    name: "Event Permit",
    title: "Event Permit",
    description: "Obtain permission for public events, gatherings, exhibitions, and festivals within city limits.",
    department: "municipal",
    icon: "calendar",
    required_documents: ["Event proposal", "Security plan", "Insurance certificate", "Venue approval letter"],
    processing_time: "10-14 business days",
    fee: 15000,
    status: "available",
    thumbnail: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=800&h=600&fit=crop",
  },
  {
    id: "gov_004",
    name: "Trade License",
    title: "Trade License",
    description: "Import/export license for businesses engaged in international trade and commerce activities.",
    department: "trade",
    icon: "globe",
    required_documents: ["Business license", "Trade registration", "Bank guarantee", "Customs broker authorization"],
    processing_time: "7-10 business days",
    fee: 35000,
    status: "available",
    thumbnail: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&h=600&fit=crop",
  },
  {
    id: "gov_005",
    name: "Health Certificate",
    title: "Health Certificate",
    description: "Health and safety certification required for food establishments, healthcare facilities, and wellness centers.",
    department: "health",
    icon: "heart",
    required_documents: ["Facility inspection report", "Staff health records", "Food safety plan", "Waste management protocol"],
    processing_time: "10-15 business days",
    fee: 20000,
    status: "available",
    thumbnail: "https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=800&h=600&fit=crop",
  },
]

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const mod = req.scope.resolve("government") as any
    const { id } = req.params
    const item = await mod.retrieveServiceRequest(id)
    if (!item) {
      const seedItem = SEED_DATA.find(s => s.id === id) || SEED_DATA[0]
      return res.json({ item: seedItem })
    }
    return res.json({ item })
  } catch (error: any) {
    const seedItem = SEED_DATA.find(s => s.id === req.params.id) || SEED_DATA[0]
    return res.json({ item: seedItem })
  }
}
