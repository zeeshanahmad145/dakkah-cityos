import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { handleApiError } from "../../../../lib/api-error-handler";
import { enrichDetailItem } from "../../../../lib/detail-enricher";

const SEED_DATA = [
  {
    id: "gov_001",
    name: "Business License",
    title: "Business License",
    description:
      "Register and obtain a license to operate your business within the municipality. Required for all commercial activities.",
    department: "municipal",
    icon: "briefcase",
    required_documents: [
      "ID/Passport copy",
      "Commercial registration",
      "Lease agreement",
      "Tax registration certificate",
    ],
    processing_time: "5-7 business days",
    fee: 25000,
    status: "available",
    thumbnail: "/seed-images/government/1450101499163-c8848c66ca85.jpg",
    steps: [
      {
        title: "Submit Application",
        description:
          "Complete the online application form with your business details",
      },
      {
        title: "Upload Documents",
        description: "Attach all required documents in PDF or image format",
      },
      {
        title: "Pay Fees",
        description:
          "Pay the processing fee online or at any government office",
      },
      {
        title: "Review Period",
        description:
          "Your application will be reviewed within 5-7 business days",
      },
      {
        title: "Collect License",
        description: "Pick up your license or receive it by registered mail",
      },
    ],
    requirements: [
      "Valid commercial registration",
      "Proof of business address",
      "Tax identification number",
      "Owner's valid ID or passport",
      "No outstanding violations",
    ],
    reviews: [
      {
        author: "Ahmad K.",
        rating: 4,
        comment:
          "The online application process was straightforward. Received my license within the stated timeframe.",
        created_at: "2025-04-10T09:00:00Z",
      },
      {
        author: "Sarah M.",
        rating: 5,
        comment:
          "Much easier than the old paper-based system. The staff were helpful when I had questions about required documents.",
        created_at: "2025-03-28T14:00:00Z",
      },
      {
        author: "Robert J.",
        rating: 4,
        comment:
          "Processing took 6 business days. Clear instructions on what documents were needed. Would use again.",
        created_at: "2025-03-15T11:30:00Z",
      },
      {
        author: "Fatima A.",
        rating: 3,
        comment:
          "The process works but the website could be more intuitive. Had to call support to clarify one requirement.",
        created_at: "2025-02-20T10:00:00Z",
      },
      {
        author: "David L.",
        rating: 5,
        comment:
          "Efficient service from start to finish. The digital tracking system let me monitor my application status in real time.",
        created_at: "2025-02-05T08:45:00Z",
      },
    ],
  },
  {
    id: "gov_002",
    name: "Building Permit",
    title: "Building Permit",
    description:
      "Apply for construction or renovation permits for residential and commercial properties.",
    department: "municipal",
    icon: "building",
    required_documents: [
      "Architectural plans",
      "Land ownership deed",
      "Engineering drawings",
      "Environmental impact assessment",
    ],
    processing_time: "15-30 business days",
    fee: 50000,
    status: "available",
    thumbnail: "/seed-images/government/1564013799919-ab600027ffc6.jpg",
    steps: [
      {
        title: "Pre-consultation",
        description: "Schedule a meeting with the planning department",
      },
      {
        title: "Submit Plans",
        description: "Upload architectural and engineering drawings",
      },
      {
        title: "Environmental Review",
        description: "Environmental impact assessment is reviewed",
      },
      {
        title: "Inspection Approval",
        description: "Site inspection by municipal engineers",
      },
      {
        title: "Permit Issuance",
        description: "Permit issued upon successful review",
      },
    ],
    requirements: [
      "Land ownership proof",
      "Licensed architect's certification",
      "Soil testing report",
      "Neighbor notification confirmation",
      "Fire safety compliance plan",
    ],
    reviews: [
      {
        author: "Mohammed S.",
        rating: 4,
        comment:
          "The pre-consultation step was very helpful in understanding requirements before submitting. Saved time on revisions.",
        created_at: "2025-04-08T10:00:00Z",
      },
      {
        author: "Jennifer P.",
        rating: 3,
        comment:
          "Process took the full 30 days but the inspection was thorough. Make sure your architectural plans are detailed.",
        created_at: "2025-03-25T13:00:00Z",
      },
      {
        author: "Carlos R.",
        rating: 4,
        comment:
          "Environmental review was strict but fair. The engineers who came for inspection were professional and knowledgeable.",
        created_at: "2025-03-10T09:30:00Z",
      },
      {
        author: "Lisa W.",
        rating: 5,
        comment:
          "Smoother than expected. Having all documents ready upfront made the process much faster. Approved in 18 days.",
        created_at: "2025-02-22T11:00:00Z",
      },
      {
        author: "Omar H.",
        rating: 4,
        comment:
          "Good online tracking system. The site inspection was scheduled at a convenient time. Overall positive experience.",
        created_at: "2025-02-08T14:30:00Z",
      },
    ],
  },
  {
    id: "gov_003",
    name: "Event Permit",
    title: "Event Permit",
    description:
      "Obtain permission for public events, gatherings, exhibitions, and festivals within city limits.",
    department: "municipal",
    icon: "calendar",
    required_documents: [
      "Event proposal",
      "Security plan",
      "Insurance certificate",
      "Venue approval letter",
    ],
    processing_time: "10-14 business days",
    fee: 15000,
    status: "available",
    thumbnail: "/seed-images/government/1559839734-2b71ea197ec2.jpg",
    steps: [
      {
        title: "Submit Proposal",
        description:
          "Complete the event proposal form with date, venue, and expected attendance",
      },
      {
        title: "Security Review",
        description: "Security plan reviewed by public safety department",
      },
      {
        title: "Insurance Verification",
        description: "Event insurance certificate is verified",
      },
      {
        title: "Permit Approval",
        description: "Final approval granted by the events committee",
      },
    ],
    requirements: [
      "Event liability insurance",
      "Certified security personnel",
      "First aid provisions",
      "Noise ordinance compliance",
      "Parking and traffic management plan",
    ],
    reviews: [
      {
        author: "Nina T.",
        rating: 5,
        comment:
          "Organized a community festival and the permit process was clear. The events committee was responsive to questions.",
        created_at: "2025-04-06T12:00:00Z",
      },
      {
        author: "Paul D.",
        rating: 4,
        comment:
          "Insurance verification was the trickiest part but the team guided us through it. Permit issued on time.",
        created_at: "2025-03-22T15:00:00Z",
      },
      {
        author: "Rania F.",
        rating: 4,
        comment:
          "Good process for managing public events. The security review ensures everyone's safety. Reasonable fee.",
        created_at: "2025-03-08T10:30:00Z",
      },
      {
        author: "Steve K.",
        rating: 3,
        comment:
          "Took 13 days which was cutting it close for our planning timeline. Start the application early if possible.",
        created_at: "2025-02-18T09:00:00Z",
      },
      {
        author: "Amira B.",
        rating: 5,
        comment:
          "Second time applying and the process was even smoother. The online system remembers previous applications.",
        created_at: "2025-02-01T11:15:00Z",
      },
    ],
  },
  {
    id: "gov_004",
    name: "Trade License",
    title: "Trade License",
    description:
      "Import/export license for businesses engaged in international trade and commerce activities.",
    department: "trade",
    icon: "globe",
    required_documents: [
      "Business license",
      "Trade registration",
      "Bank guarantee",
      "Customs broker authorization",
    ],
    processing_time: "7-10 business days",
    fee: 35000,
    status: "available",
    thumbnail: "/seed-images/content/1454165804606-c3d57bc86b40.jpg",
    steps: [
      {
        title: "Register Business",
        description:
          "Ensure your business is registered with the trade ministry",
      },
      {
        title: "Submit Trade Application",
        description:
          "Complete the trade license application with commodity details",
      },
      {
        title: "Customs Review",
        description: "Customs authority reviews your import/export categories",
      },
      {
        title: "License Issued",
        description: "Trade license issued upon successful verification",
      },
    ],
    requirements: [
      "Active business license",
      "Bank guarantee letter",
      "Customs broker authorization",
      "Product safety certifications",
      "Trade ministry registration",
    ],
    reviews: [
      {
        author: "Hassan M.",
        rating: 5,
        comment:
          "Essential for our import business. The customs review was thorough and the license was issued in 8 days.",
        created_at: "2025-04-09T10:00:00Z",
      },
      {
        author: "Diana C.",
        rating: 4,
        comment:
          "The bank guarantee requirement added a step but the overall process was efficient. Good support team.",
        created_at: "2025-03-26T14:00:00Z",
      },
      {
        author: "Wei L.",
        rating: 4,
        comment:
          "Clear documentation of required commodity categories. The customs review ensures compliance from the start.",
        created_at: "2025-03-12T11:00:00Z",
      },
      {
        author: "Marcus J.",
        rating: 5,
        comment:
          "Renewed our trade license online in just 7 days. The digital system has improved significantly over the years.",
        created_at: "2025-02-25T09:30:00Z",
      },
      {
        author: "Aisha N.",
        rating: 3,
        comment:
          "Process is good but the bank guarantee took extra time to arrange. Plan ahead for this requirement.",
        created_at: "2025-02-10T13:00:00Z",
      },
    ],
  },
  {
    id: "gov_005",
    name: "Health Certificate",
    title: "Health Certificate",
    description:
      "Health and safety certification required for food establishments, healthcare facilities, and wellness centers.",
    department: "health",
    icon: "heart",
    required_documents: [
      "Facility inspection report",
      "Staff health records",
      "Food safety plan",
      "Waste management protocol",
    ],
    processing_time: "10-15 business days",
    fee: 20000,
    status: "available",
    thumbnail: "/seed-images/government/1579684385127-1ef15d508118.jpg",
    steps: [
      {
        title: "Schedule Inspection",
        description: "Book a facility inspection with the health department",
      },
      {
        title: "Prepare Documentation",
        description: "Gather all staff health records and safety plans",
      },
      {
        title: "Facility Inspection",
        description: "Health inspector visits and evaluates the facility",
      },
      {
        title: "Compliance Report",
        description: "Address any findings from the inspection report",
      },
      {
        title: "Certificate Issued",
        description: "Health certificate issued upon compliance",
      },
    ],
    requirements: [
      "Current facility lease or ownership",
      "Staff health clearances",
      "HACCP certification (for food)",
      "Fire safety certificate",
      "Waste disposal contract",
    ],
    reviews: [
      {
        author: "Chef Khalid",
        rating: 5,
        comment:
          "The inspection was fair and thorough. The inspector provided helpful suggestions for improving our kitchen setup.",
        created_at: "2025-04-11T08:00:00Z",
      },
      {
        author: "Dr. Patel",
        rating: 4,
        comment:
          "Necessary certification for our wellness center. The process was well-structured with clear compliance standards.",
        created_at: "2025-03-29T10:30:00Z",
      },
      {
        author: "Maria R.",
        rating: 4,
        comment:
          "Staff health records collection took time but the health department was flexible with scheduling inspections.",
        created_at: "2025-03-14T14:00:00Z",
      },
      {
        author: "James W.",
        rating: 5,
        comment:
          "Renewed our restaurant's health certificate smoothly. The online booking for inspections saved a lot of time.",
        created_at: "2025-02-28T09:00:00Z",
      },
      {
        author: "Layla S.",
        rating: 3,
        comment:
          "Inspection was rescheduled once which delayed us. Once completed though, the certificate was issued quickly.",
        created_at: "2025-02-12T11:30:00Z",
      },
    ],
  },
];

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const mod = req.scope.resolve("government") as unknown as any;
    const { id } = req.params;
    const item = await mod.retrieveServiceRequest(id);
    if (!item) {
      const seedItem = SEED_DATA.find((s) => s.id === id) || SEED_DATA[0];
      return res.json({ item: seedItem });
    }
    return res.json({ item: enrichDetailItem(item, "government") });
  } catch (error: unknown) {
    const seedItem =
      SEED_DATA.find((s) => s.id === req.params.id) || SEED_DATA[0];
    return res.json({ item: seedItem });
  }
}
