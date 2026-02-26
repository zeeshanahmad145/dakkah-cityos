import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

const SEED_DATA = [
  { id: "ins-1", name: "Comprehensive Health Insurance", description: "Full medical coverage including hospitalization, outpatient care, dental, and vision for individuals and families.", insurance_type: "health", coverage_details: ["Hospitalization up to 500,000 SAR", "Outpatient visits covered", "Dental & vision included"], features: ["No waiting period", "Worldwide coverage", "Family plans available", "24/7 telemedicine"], currency_code: "SAR", metadata: { thumbnail: "/seed-images/fitness%2F1576091160399-112ba8d25d1d.jpg", price: 15000, rating: 4.8 }, is_active: true },
  { id: "ins-2", name: "Auto Insurance Premium", description: "Complete vehicle protection with collision, theft, third-party liability, and roadside assistance coverage.", insurance_type: "auto", coverage_details: ["Collision & comprehensive", "Third-party liability", "24/7 roadside assistance"], features: ["Accident forgiveness", "New car replacement", "Rental car coverage", "Flexible deductibles"], currency_code: "SAR", metadata: { thumbnail: "/seed-images/auctions%2F1489824904134-891ab64532f1.jpg", price: 5000, rating: 4.6 }, is_active: true },
  { id: "ins-3", name: "Home Protection Plan", description: "Safeguard your property against natural disasters, theft, fire, and accidental damage with flexible coverage.", insurance_type: "home", coverage_details: ["Structure & contents covered", "Natural disaster protection", "Liability coverage included"], features: ["Replacement cost coverage", "Temporary housing", "Personal property protection", "Identity theft coverage"], currency_code: "SAR", metadata: { thumbnail: "/seed-images/financial-products%2F1560518883-ce09059eeffa.jpg", price: 8000, rating: 4.7 }, is_active: true },
  { id: "ins-4", name: "Term Life Insurance", description: "Financial security for your loved ones with affordable term life coverage and flexible payout options.", insurance_type: "life", coverage_details: ["Coverage up to 2,000,000 SAR", "Flexible term lengths", "Accidental death benefit"], features: ["Guaranteed premiums", "Convertible to whole life", "No medical exam options", "Beneficiary flexibility"], currency_code: "SAR", metadata: { thumbnail: "/seed-images/insurance%2F1491438590914-bc09fcaaf77a.jpg", price: 3000, rating: 4.9 }, is_active: true },
  { id: "ins-5", name: "Global Travel Insurance", description: "Worldwide coverage for medical emergencies, trip cancellation, lost baggage, and travel delays.", insurance_type: "travel", coverage_details: ["Medical emergencies abroad", "Trip cancellation refund", "Lost baggage compensation"], features: ["Instant policy issuance", "Multi-trip plans available", "Adventure sports coverage", "24/7 emergency hotline"], currency_code: "SAR", metadata: { thumbnail: "/seed-images/event-ticketing%2F1488646953014-85cb44e25828.jpg", price: 500, rating: 4.5 }, is_active: true },
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
    return res.json({ item })
  } catch (error: any) {
    const { id } = req.params
    const seedItem = SEED_DATA.find(i => i.id === id) || SEED_DATA[0]
    return res.json({ item: seedItem })
  }
}
