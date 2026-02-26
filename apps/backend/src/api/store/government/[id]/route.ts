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
    thumbnail: "/seed-images/government%2F1450101499163-c8848c66ca85.jpg",
    steps: [
      { title: "Submit Application", description: "Complete the online application form with your business details" },
      { title: "Upload Documents", description: "Attach all required documents in PDF or image format" },
      { title: "Pay Fees", description: "Pay the processing fee online or at any government office" },
      { title: "Review Period", description: "Your application will be reviewed within 5-7 business days" },
      { title: "Collect License", description: "Pick up your license or receive it by registered mail" },
    ],
    requirements: ["Valid commercial registration", "Proof of business address", "Tax identification number", "Owner's valid ID or passport", "No outstanding violations"],
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
    thumbnail: "/seed-images/government%2F1564013799919-ab600027ffc6.jpg",
    steps: [
      { title: "Pre-consultation", description: "Schedule a meeting with the planning department" },
      { title: "Submit Plans", description: "Upload architectural and engineering drawings" },
      { title: "Environmental Review", description: "Environmental impact assessment is reviewed" },
      { title: "Inspection Approval", description: "Site inspection by municipal engineers" },
      { title: "Permit Issuance", description: "Permit issued upon successful review" },
    ],
    requirements: ["Land ownership proof", "Licensed architect's certification", "Soil testing report", "Neighbor notification confirmation", "Fire safety compliance plan"],
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
    thumbnail: "/seed-images/government%2F1559839734-2b71ea197ec2.jpg",
    steps: [
      { title: "Submit Proposal", description: "Complete the event proposal form with date, venue, and expected attendance" },
      { title: "Security Review", description: "Security plan reviewed by public safety department" },
      { title: "Insurance Verification", description: "Event insurance certificate is verified" },
      { title: "Permit Approval", description: "Final approval granted by the events committee" },
    ],
    requirements: ["Event liability insurance", "Certified security personnel", "First aid provisions", "Noise ordinance compliance", "Parking and traffic management plan"],
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
    thumbnail: "/seed-images/content%2F1454165804606-c3d57bc86b40.jpg",
    steps: [
      { title: "Register Business", description: "Ensure your business is registered with the trade ministry" },
      { title: "Submit Trade Application", description: "Complete the trade license application with commodity details" },
      { title: "Customs Review", description: "Customs authority reviews your import/export categories" },
      { title: "License Issued", description: "Trade license issued upon successful verification" },
    ],
    requirements: ["Active business license", "Bank guarantee letter", "Customs broker authorization", "Product safety certifications", "Trade ministry registration"],
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
    thumbnail: "/seed-images/government%2F1579684385127-1ef15d508118.jpg",
    steps: [
      { title: "Schedule Inspection", description: "Book a facility inspection with the health department" },
      { title: "Prepare Documentation", description: "Gather all staff health records and safety plans" },
      { title: "Facility Inspection", description: "Health inspector visits and evaluates the facility" },
      { title: "Compliance Report", description: "Address any findings from the inspection report" },
      { title: "Certificate Issued", description: "Health certificate issued upon compliance" },
    ],
    requirements: ["Current facility lease or ownership", "Staff health clearances", "HACCP certification (for food)", "Fire safety certificate", "Waste disposal contract"],
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
