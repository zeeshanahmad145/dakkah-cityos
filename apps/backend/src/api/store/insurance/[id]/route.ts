import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { enrichDetailItem } from "../../../../lib/detail-enricher"

const SEED_DATA = [
  {
    id: "ins-1", name: "Comprehensive Health Insurance", description: "Full medical coverage including hospitalization, outpatient care, dental, and vision for individuals and families.", insurance_type: "health", thumbnail: "/seed-images/insurance/1491438590914-bc09fcaaf77a.jpg", coverage_details: ["Hospitalization up to 500,000 SAR", "Outpatient visits covered", "Dental & vision included"], features: ["No waiting period", "Worldwide coverage", "Family plans available", "24/7 telemedicine"], exclusions: ["Pre-existing conditions (first 12 months)", "Cosmetic procedures", "Experimental treatments", "Self-inflicted injuries"], currency_code: "SAR", metadata: { thumbnail: "/seed-images/fitness/1576091160399-112ba8d25d1d.jpg", price: 15000, rating: 4.8 }, is_active: true,
    reviews: [
      { author: "Abdullah R.", rating: 5, comment: "This plan covered my entire family's medical needs. The 24/7 telemedicine service has been incredibly convenient.", created_at: "2025-04-10T09:00:00Z" },
      { author: "Maria C.", rating: 4, comment: "Comprehensive coverage that lives up to its name. Dental and vision inclusion saves us a separate policy.", created_at: "2025-03-28T14:00:00Z" },
      { author: "John D.", rating: 5, comment: "No waiting period was the deciding factor for us. Claims are processed quickly and customer service is responsive.", created_at: "2025-03-15T11:00:00Z" },
      { author: "Fatima H.", rating: 4, comment: "Great worldwide coverage for when we travel. The hospitalization coverage limit is generous and reassuring.", created_at: "2025-02-20T10:30:00Z" },
      { author: "David W.", rating: 5, comment: "Best health insurance we've ever had. Everything from routine checkups to emergency care is covered seamlessly.", created_at: "2025-02-05T08:00:00Z" },
    ],
  },
  {
    id: "ins-2", name: "Auto Insurance Premium", description: "Complete vehicle protection with collision, theft, third-party liability, and roadside assistance coverage.", insurance_type: "auto", thumbnail: "/seed-images/insurance/1491438590914-bc09fcaaf77a.jpg", coverage_details: ["Collision & comprehensive", "Third-party liability", "24/7 roadside assistance"], features: ["Accident forgiveness", "New car replacement", "Rental car coverage", "Flexible deductibles"], exclusions: ["Racing or speed contests", "Wear and tear", "Driving under influence", "Unlicensed drivers"], currency_code: "SAR", metadata: { thumbnail: "/seed-images/auctions/1489824904134-891ab64532f1.jpg", price: 5000, rating: 4.6 }, is_active: true,
    reviews: [
      { author: "Mohammed S.", rating: 5, comment: "The roadside assistance saved me when my car broke down on the highway. Response was within 30 minutes.", created_at: "2025-04-08T15:00:00Z" },
      { author: "Sarah L.", rating: 4, comment: "Accident forgiveness is a great feature. Had a minor fender bender and my premium didn't increase.", created_at: "2025-03-25T10:00:00Z" },
      { author: "Ahmed K.", rating: 4, comment: "Good coverage for the price. The rental car benefit was useful while my vehicle was being repaired.", created_at: "2025-03-10T12:30:00Z" },
      { author: "Lisa T.", rating: 5, comment: "Flexible deductible options let me customize the policy to my budget. Claims process was smooth and fair.", created_at: "2025-02-22T09:00:00Z" },
      { author: "Omar N.", rating: 4, comment: "Comprehensive protection that gives peace of mind. The new car replacement feature is excellent for newer vehicles.", created_at: "2025-02-08T14:00:00Z" },
    ],
  },
  {
    id: "ins-3", name: "Home Protection Plan", description: "Safeguard your property against natural disasters, theft, fire, and accidental damage with flexible coverage.", insurance_type: "home", thumbnail: "/seed-images/insurance/1491438590914-bc09fcaaf77a.jpg", coverage_details: ["Structure & contents covered", "Natural disaster protection", "Liability coverage included"], features: ["Replacement cost coverage", "Temporary housing", "Personal property protection", "Identity theft coverage"], exclusions: ["Intentional damage", "Government seizure", "Nuclear hazards", "Normal wear and deterioration"], currency_code: "SAR", metadata: { thumbnail: "/seed-images/financial-products/1560518883-ce09059eeffa.jpg", price: 8000, rating: 4.7 }, is_active: true,
    reviews: [
      { author: "Karen B.", rating: 5, comment: "After a water pipe burst, the claim was handled swiftly. Temporary housing benefit was a lifesaver for our family.", created_at: "2025-04-06T10:00:00Z" },
      { author: "James M.", rating: 4, comment: "Identity theft coverage is a nice bonus. The replacement cost coverage means we get full value, not depreciated.", created_at: "2025-03-22T13:00:00Z" },
      { author: "Amira F.", rating: 5, comment: "Comprehensive home protection at a reasonable price. The personal property coverage gave us peace of mind.", created_at: "2025-03-08T09:30:00Z" },
      { author: "Steve R.", rating: 4, comment: "Good coverage for natural disasters which was important in our area. Claims adjuster was professional and fair.", created_at: "2025-02-18T11:00:00Z" },
      { author: "Diana P.", rating: 5, comment: "The liability coverage has been excellent. Flexible plan options allowed us to customize for our specific needs.", created_at: "2025-02-01T08:45:00Z" },
    ],
  },
  {
    id: "ins-4", name: "Term Life Insurance", description: "Financial security for your loved ones with affordable term life coverage and flexible payout options.", insurance_type: "life", thumbnail: "/seed-images/insurance/1491438590914-bc09fcaaf77a.jpg", coverage_details: ["Coverage up to 2,000,000 SAR", "Flexible term lengths", "Accidental death benefit"], features: ["Guaranteed premiums", "Convertible to whole life", "No medical exam options", "Beneficiary flexibility"], exclusions: ["Suicide within first 2 years", "Death during illegal activity", "Misrepresentation on application", "War or terrorism acts"], currency_code: "SAR", metadata: { thumbnail: "/seed-images/insurance/1491438590914-bc09fcaaf77a.jpg", price: 3000, rating: 4.9 }, is_active: true,
    reviews: [
      { author: "Michael H.", rating: 5, comment: "Affordable premiums for substantial coverage. The no medical exam option made the application process quick and easy.", created_at: "2025-04-09T12:00:00Z" },
      { author: "Noor A.", rating: 5, comment: "Guaranteed premiums give us predictable costs. The convertibility option to whole life is a smart feature.", created_at: "2025-03-26T10:00:00Z" },
      { author: "Patricia G.", rating: 4, comment: "Great peace of mind knowing my family is protected. The beneficiary flexibility was important for our situation.", created_at: "2025-03-12T14:30:00Z" },
      { author: "Thomas K.", rating: 5, comment: "Best value term life insurance we found. Coverage amount is generous and the application was straightforward.", created_at: "2025-02-25T09:00:00Z" },
      { author: "Layla M.", rating: 5, comment: "The accidental death benefit adds extra protection. Very competitive rates compared to other providers.", created_at: "2025-02-10T11:30:00Z" },
    ],
  },
  {
    id: "ins-5", name: "Global Travel Insurance", description: "Worldwide coverage for medical emergencies, trip cancellation, lost baggage, and travel delays.", insurance_type: "travel", thumbnail: "/seed-images/insurance/1491438590914-bc09fcaaf77a.jpg", coverage_details: ["Medical emergencies abroad", "Trip cancellation refund", "Lost baggage compensation"], features: ["Instant policy issuance", "Multi-trip plans available", "Adventure sports coverage", "24/7 emergency hotline"], exclusions: ["Pre-existing medical conditions", "Travel to sanctioned countries", "Alcohol-related incidents", "Extreme sports without rider"], currency_code: "SAR", metadata: { thumbnail: "/seed-images/event-ticketing/1488646953014-85cb44e25828.jpg", price: 500, rating: 4.5 }, is_active: true,
    reviews: [
      { author: "Alex T.", rating: 5, comment: "Used the medical emergency coverage during a trip to Thailand. The 24/7 hotline arranged everything quickly.", created_at: "2025-04-11T16:00:00Z" },
      { author: "Emma S.", rating: 4, comment: "Instant policy issuance is so convenient. Bought it right before my flight and was covered immediately.", created_at: "2025-03-29T08:00:00Z" },
      { author: "Hassan B.", rating: 5, comment: "The multi-trip plan saved me money as a frequent traveler. Adventure sports coverage let me ski worry-free.", created_at: "2025-03-14T13:00:00Z" },
      { author: "Jessica N.", rating: 4, comment: "Got reimbursed for a cancelled flight within a week. The claims process was surprisingly simple and fast.", created_at: "2025-02-28T10:00:00Z" },
      { author: "Ryan W.", rating: 4, comment: "Lost baggage compensation came through when the airline couldn't find my suitcase. Good coverage for the price.", created_at: "2025-02-12T15:30:00Z" },
    ],
  },
]

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const financialProductService = req.scope.resolve("financialProduct") as any
    const { id } = req.params

    const item = await financialProductService.retrieveInsuranceProduct(id)
    if (!item) {
      const seedItem = SEED_DATA.find(i => i.id === id) || SEED_DATA[0]
      return res.json({ item: seedItem })
    }
    return res.json({ item: enrichDetailItem(item, "insurance") })
  } catch (error: any) {
    const { id } = req.params
    const seedItem = SEED_DATA.find(i => i.id === id) || SEED_DATA[0]
    return res.json({ item: seedItem })
  }
}
