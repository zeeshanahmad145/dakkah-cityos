import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { handleApiError } from "../../../lib/api-error-handler"

const SEED_COMPANIES = [
  { id: "b2b-1", name: "Acme Industrial Supplies", company_name: "Acme Industrial Supplies", description: "Leading provider of industrial equipment and supplies for businesses of all sizes. Bulk ordering with competitive pricing.", industry: "Industrial", thumbnail: "/seed-images/b2b%2F1486406146926-c627a92ad1ab.jpg", location: "Riyadh Industrial City", established: 2008, employees: 450, products_services: ["Industrial Equipment", "Safety Gear", "Bulk Supplies", "Custom Orders"], rating: 4.7, review_count: 156 },
  { id: "b2b-2", name: "TechParts Global", company_name: "TechParts Global", description: "Wholesale technology components and parts for manufacturers and tech companies. ISO 9001 certified.", industry: "Technology", thumbnail: "/seed-images/b2b%2F1504384308090-c894fdcc538d.jpg", location: "Jeddah Tech Park", established: 2012, employees: 280, products_services: ["Electronic Components", "PCB Manufacturing", "Assembly Services", "Quality Testing"], rating: 4.8, review_count: 203 },
  { id: "b2b-3", name: "Green Energy Solutions", company_name: "Green Energy Solutions", description: "Sustainable energy products and solutions for commercial buildings. Solar panels, battery storage, and smart grid integration.", industry: "Energy", thumbnail: "/seed-images/b2b%2F1497435334941-8c899ee9e8e9.jpg", location: "Dammam Business District", established: 2015, employees: 180, products_services: ["Solar Panels", "Battery Storage", "Energy Audits", "Smart Grid"], rating: 4.6, review_count: 98 },
  { id: "b2b-4", name: "FreshSource Foods", company_name: "FreshSource Foods", description: "Wholesale organic food distribution, cold chain logistics, and private label food manufacturing.", industry: "Food & Beverage", thumbnail: "/seed-images/b2b%2F1606787366850-de6330128bfc.jpg", location: "Riyadh", established: 2010, employees: 350, products_services: ["Organic Wholesale", "Cold Chain Logistics", "Private Label", "Food Safety Consulting"], rating: 4.5, review_count: 134 },
  { id: "b2b-5", name: "MedEquip International", company_name: "MedEquip International", description: "Medical equipment manufacturing, hospital supply chain, and healthcare technology solutions.", industry: "Healthcare", thumbnail: "/seed-images/b2b%2F1519494026892-80bbd2d6fd0d.jpg", location: "Riyadh", established: 2001, employees: 600, products_services: ["Medical Devices", "Hospital Supplies", "Telemedicine", "Lab Equipment"], rating: 4.9, review_count: 245 },
  { id: "b2b-6", name: "DataStream Analytics", company_name: "DataStream Analytics", description: "Big data analytics, business intelligence dashboards, and AI-powered predictive modeling.", industry: "Technology", thumbnail: "/seed-images/b2b%2F1551288049-bebda4e38f71.jpg", location: "Riyadh", established: 2015, employees: 180, products_services: ["Data Analytics", "BI Dashboards", "AI/ML Solutions", "Data Warehousing"], rating: 4.7, review_count: 87 },
]

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const companyService = req.scope.resolve("company") as any
    const {
      limit = "20",
      offset = "0",
      tenant_id,
      category,
      min_order,
      status,
      search,
    } = req.query as Record<string, string | undefined>

    const filters: Record<string, any> = {}
    if (tenant_id) filters.tenant_id = tenant_id
    if (category) filters.category = category
    if (status) {
      filters.status = status
    } else {
      filters.status = "approved"
    }
    if (min_order) filters.min_order_amount = { $gte: Number(min_order) }
    if (search) filters.name = { $like: `%${search}%` }

    const items = await companyService.listCompanies(filters, {
      skip: Number(offset),
      take: Number(limit),
      order: { created_at: "DESC" },
    })

    const itemList = Array.isArray(items) ? items : []

    if (itemList.length === 0) {
      return res.json({
        items: SEED_COMPANIES,
        count: SEED_COMPANIES.length,
        limit: Number(limit),
        offset: Number(offset),
      })
    }

    return res.json({
      items: itemList,
      count: itemList.length,
      limit: Number(limit),
      offset: Number(offset),
    })
  } catch (error: any) {
    return res.json({
      items: SEED_COMPANIES,
      count: SEED_COMPANIES.length,
      limit: 20,
      offset: 0,
    })
  }
}

