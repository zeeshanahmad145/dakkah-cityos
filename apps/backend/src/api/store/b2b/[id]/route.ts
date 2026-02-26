import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { handleApiError } from "../../../../lib/api-error-handler"

const SEED_B2B = [
  { id: "b2b-1", name: "Acme Industrial Supplies", description: "Leading provider of industrial equipment and supplies for businesses of all sizes. Bulk ordering with competitive pricing.", company_type: "supplier", industry: "Industrial", contact_email: "sales@acme-industrial.com", phone: "+966 11 555 1234", address: "Riyadh Industrial City", status: "active", credit_limit: 50000000, payment_terms: "NET-30", thumbnail: "/seed-images/b2b%2F1486406146926-c627a92ad1ab.jpg", metadata: { thumbnail: "/seed-images/b2b%2F1486406146926-c627a92ad1ab.jpg" }, bulk_pricing: [{ min_quantity: 1, max_quantity: 99, price: 4999, discount: "0%" }, { min_quantity: 100, max_quantity: 499, price: 4499, discount: "10%" }, { min_quantity: 500, max_quantity: null, price: 3999, discount: "20%" }], certifications: ["ISO 9001:2015", "ISO 14001 Environmental", "OHSAS 18001 Safety"], products: [{ id: "prod-1", title: "Industrial Safety Helmet", name: "Industrial Safety Helmet", price: 4500, moq: 50, thumbnail: "/seed-images/b2b%2F1486406146926-c627a92ad1ab.jpg" }, { id: "prod-2", title: "Heavy-Duty Work Gloves", name: "Heavy-Duty Work Gloves", price: 1200, moq: 100, thumbnail: "/seed-images/b2b%2F1504384308090-c894fdcc538d.jpg" }, { id: "prod-3", title: "Steel-Toe Safety Boots", name: "Steel-Toe Safety Boots", price: 8900, moq: 25, thumbnail: "/seed-images/b2b%2F1497435334941-8c899ee9e8e9.jpg" }, { id: "prod-4", title: "High-Vis Safety Vest", name: "High-Vis Safety Vest", price: 2500, moq: 200, thumbnail: "/seed-images/b2b%2F1486406146926-c627a92ad1ab.jpg" }] },
  { id: "b2b-2", name: "TechParts Global", description: "Wholesale technology components and parts for manufacturers and tech companies. ISO 9001 certified.", company_type: "manufacturer", industry: "Technology", contact_email: "orders@techparts.com", phone: "+966 12 555 5678", address: "Jeddah Tech Park", status: "active", credit_limit: 75000000, payment_terms: "NET-60", thumbnail: "/seed-images/b2b%2F1504384308090-c894fdcc538d.jpg", metadata: { thumbnail: "/seed-images/b2b%2F1504384308090-c894fdcc538d.jpg" }, bulk_pricing: [{ min_quantity: 1, max_quantity: 49, price: 12999, discount: "0%" }, { min_quantity: 50, max_quantity: 199, price: 11699, discount: "10%" }, { min_quantity: 200, max_quantity: null, price: 10399, discount: "20%" }], certifications: ["ISO 9001:2015", "RoHS Compliant", "CE Certified"], products: [{ id: "prod-5", title: "Motherboard Assembly Kit", name: "Motherboard Assembly Kit", price: 15000, moq: 20, thumbnail: "/seed-images/b2b%2F1504384308090-c894fdcc538d.jpg" }, { id: "prod-6", title: "LED Display Panel", name: "LED Display Panel", price: 8500, moq: 50, thumbnail: "/seed-images/b2b%2F1497435334941-8c899ee9e8e9.jpg" }, { id: "prod-7", title: "Copper Wire Harness", name: "Copper Wire Harness", price: 3200, moq: 100, thumbnail: "/seed-images/b2b%2F1486406146926-c627a92ad1ab.jpg" }] },
  { id: "b2b-3", name: "Green Energy Solutions", description: "Sustainable energy products and solutions for commercial buildings. Solar panels, battery storage, and smart grid integration.", company_type: "distributor", industry: "Energy", contact_email: "info@greenenergy.sa", phone: "+966 13 555 9012", address: "Dammam Business District", status: "active", credit_limit: 100000000, payment_terms: "NET-45", thumbnail: "/seed-images/b2b%2F1497435334941-8c899ee9e8e9.jpg", metadata: { thumbnail: "/seed-images/b2b%2F1497435334941-8c899ee9e8e9.jpg" }, bulk_pricing: [{ min_quantity: 1, max_quantity: 9, price: 89900, discount: "0%" }, { min_quantity: 10, max_quantity: 49, price: 80900, discount: "10%" }, { min_quantity: 50, max_quantity: null, price: 71900, discount: "20%" }], certifications: ["IEC 61215 Solar Panel", "UL Listed", "Energy Star Partner"], products: [{ id: "prod-8", title: "400W Solar Panel", name: "400W Solar Panel", price: 45000, moq: 10, thumbnail: "/seed-images/b2b%2F1497435334941-8c899ee9e8e9.jpg" }, { id: "prod-9", title: "10kWh Battery Storage", name: "10kWh Battery Storage", price: 250000, moq: 5, thumbnail: "/seed-images/b2b%2F1504384308090-c894fdcc538d.jpg" }, { id: "prod-10", title: "Smart Grid Inverter", name: "Smart Grid Inverter", price: 120000, moq: 10, thumbnail: "/seed-images/b2b%2F1486406146926-c627a92ad1ab.jpg" }] },
]

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const companyService = req.scope.resolve("company") as any
    const { id } = req.params
    const item = await companyService.retrieveCompany(id)
    if (!item) {
      const seed = SEED_B2B.find((s) => s.id === id) || SEED_B2B[0]
      return res.json({ item: { ...seed, id } })
    }
    return res.json({ item })
  } catch (error: any) {
    const { id } = req.params
    const seed = SEED_B2B.find((s) => s.id === id) || SEED_B2B[0]
    return res.json({ item: { ...seed, id } })
  }
}
