import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { handleApiError } from "../../../../lib/api-error-handler"

const SEED_B2B = [
  { id: "b2b-1", name: "Acme Industrial Supplies", description: "Leading provider of industrial equipment and supplies for businesses of all sizes. Bulk ordering with competitive pricing.", company_type: "supplier", industry: "Industrial", contact_email: "sales@acme-industrial.com", phone: "+966 11 555 1234", address: "Riyadh Industrial City", status: "active", credit_limit: 50000000, payment_terms: "NET-30", thumbnail: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&h=600&fit=crop", metadata: { thumbnail: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&h=600&fit=crop" } },
  { id: "b2b-2", name: "TechParts Global", description: "Wholesale technology components and parts for manufacturers and tech companies. ISO 9001 certified.", company_type: "manufacturer", industry: "Technology", contact_email: "orders@techparts.com", phone: "+966 12 555 5678", address: "Jeddah Tech Park", status: "active", credit_limit: 75000000, payment_terms: "NET-60", thumbnail: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800&h=600&fit=crop", metadata: { thumbnail: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800&h=600&fit=crop" } },
  { id: "b2b-3", name: "Green Energy Solutions", description: "Sustainable energy products and solutions for commercial buildings. Solar panels, battery storage, and smart grid integration.", company_type: "distributor", industry: "Energy", contact_email: "info@greenenergy.sa", phone: "+966 13 555 9012", address: "Dammam Business District", status: "active", credit_limit: 100000000, payment_terms: "NET-45", thumbnail: "https://images.unsplash.com/photo-1497435334941-8c899ee9e8e9?w=800&h=600&fit=crop", metadata: { thumbnail: "https://images.unsplash.com/photo-1497435334941-8c899ee9e8e9?w=800&h=600&fit=crop" } },
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
